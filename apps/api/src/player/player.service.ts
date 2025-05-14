import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import {
  CreateGuestDto,
  CreateUserDto,
  DetailedPlayerDto,
  PlayerInfoDto,
  UpdateFriendsInfoDto,
  UserRole,
  WSE,
} from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'
import { PlayerNotFoundWsException } from '../common/ws/exceptions/playerNotFound'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { CommonService } from '../common/common.service'
import { FriendRequest } from './entities/friend.request.entity'
import { UnauthorizedWsException } from '../common/ws/exceptions/unauthorized'

// This should be a real class/interface representing a user entity

@Injectable()
export class PlayerService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private commonService: CommonService,
  ) {}
  private logger = new Logger(PlayerService.name)
  async onAskFriendsInfo(player: Player): Promise<void> {
    const friends = await this.getFriendsOnlineStatus(player.friends)
    const data: UpdateFriendsInfoDto = {
      event: WSE.UPDATE_FRIENDS_INFO,
      arguments: { friends },
    }
    this.commonService.emitToPlayer(player.id, data)
  }

  async createGuest(createGuestDto: CreateGuestDto): Promise<Player> {
    if (createGuestDto.name.trim() != '') {
      const userEntity = this.playerRepository.create({
        name: createGuestDto.name,
        role: UserRole.GUEST,
      })
      const user = await this.playerRepository.save(userEntity)
      this.logger.log('GUEST CREATED')
      return user
    }
  }
  async createPlayer(createUser: CreateUserDto, avatar?: MemoryStorageFile): Promise<Player> {
    try {
      if (createUser.name.trim() != '') {
        const userEntity = this.playerRepository.create(createUser)
        const user = await this.playerRepository.save(userEntity)
        if (avatar) {
          const avatarUrl = await this.commonService.uploadImage(
            avatar,
            user.id,
            true,
            'avatar',
            300,
          )
          user.avatar = avatarUrl
          await this.playerRepository.save(user)
        }
        return user
      }
    } catch (error) {
      if (error?.code === '23505') {
        throw new HttpException('Email already used', HttpStatus.BAD_REQUEST)
      } else {
        throw new BadRequestException(error)
      }
    }
  }
  async get(playerId: string, includeFriends: boolean = false): Promise<Player | undefined> {
    try {
      const player = await this.playerRepository.findOne({
        where: {
          id: playerId,
        },
        relations: { room: true },
      })
      if (includeFriends) {
        const friends = await this.playerRepository.query(
          ` SELECT id,name, role, avatar, "roomId" as room
        FROM player P
        WHERE P.id <> $1
          AND EXISTS(
            SELECT 1
            FROM player_friends_player F
            WHERE (F."playerId_1" = $1 AND F."playerId_2" = P.id )
            OR (F."playerId_2" = $1 AND F."playerId_1" = P.id )
            );  `,
          [playerId],
        )
        friends.map((f) => {
          f.room = { id: f.room }
          return f
        })
        player.friends = friends
      }
      return player
    } catch (err) {
      this.logger.error(err)
      throw new PlayerNotFoundWsException()
    }
  }
  async getPlayerFromSocket(client: Socket, includeFriends?: boolean): Promise<Player | undefined> {
    this.authService.validateWsConnexion(client)
    const player = await this.get(client.data.playerId, includeFriends)
    return player
  }
  generatePlayerInfoDto(
    player: Player,
    artists: string[],
    includeFriends: boolean = false,
  ): PlayerInfoDto {
    return new PlayerInfoDto({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      isArtist: artists.includes(player.id),
      role: player.role,
      room: player.room?.id,
      friends: includeFriends ? player.friends.map((friend) => friend.id) : undefined,
    })
  }
  async resetPlayerRooms(): Promise<void> {
    try {
      await this.playerRepository.update({}, { room: null })
    } catch (error) {
      this.logger.error(error)
    }
  }
  async getPlayerCredentials(email: string): Promise<Pick<Player, 'id' | 'password'>> {
    const player = await this.playerRepository.findOne({
      where: { email },
      select: { password: true, id: true },
    })
    return player
  }
  async getPlayerEmail(id: string): Promise<Pick<Player, 'id' | 'email'>> {
    const player = await this.playerRepository.findOne({
      where: { id },
      select: { email: true, id: true },
    })
    return player
  }
  async getFriendsOnlineStatus(
    friends: Player['friends'],
  ): Promise<Array<PlayerInfoDto & { online: boolean }>> {
    if (!friends) {
      return []
    }
    return friends.map((friend) => ({
      ...this.generatePlayerInfoDto(friend, []),
      online: this.commonService.getSocketFromPlayer(friend.id)?.connected ?? false,
    }))
  }
  async requestFriend(player: Player, newFriendId: Player['id']): Promise<void> {
    try {
      const newFriend = await this.get(newFriendId)
      if (player.role === UserRole.GUEST || newFriend.role === UserRole.GUEST) {
        throw new UnauthorizedWsException()
      }
      if (player.friends.map((friend) => friend.id).includes(newFriendId)) {
        return
      }
      // Check if there is a pending request that current player hasn't accepted yet
      const existingReceivedRequest = await this.friendRequestRepository.findOne({
        where: { receiver: player, accepted: false },
      })
      if (existingReceivedRequest != undefined) {
        this.acceptFriendRequest(player, existingReceivedRequest.id)
        return
      }
      const existingSentRequest = await this.friendRequestRepository.findOne({
        where: { sender: player, accepted: false },
      })

      if (existingSentRequest) {
        return
      }
      const requestEntity = this.friendRequestRepository.create({
        sender: player,
        receiver: newFriend,
        accepted: false,
        answered: false,
      })
      await this.friendRequestRepository.save(requestEntity)
    } catch (error) {
      this.logger.error(error)
      throw new BadRequestException()
    }
  }
  async acceptFriendRequest(player: Player, requestId: FriendRequest['id']): Promise<void> {
    try {
      const request = await this.friendRequestRepository.findOne({
        where: {
          id: requestId,
        },
        relations: { receiver: true, sender: true },
      })
      if (!request) {
        return
      }
      if (request.receiver.id !== player.id) {
        throw new UnauthorizedWsException()
      }
      request.answered = true
      request.accepted = true
      await this.friendRequestRepository.save(request)
      const newFriend = await this.get(request.sender.id, true)
      if (newFriend.friends.map((f) => f.id).includes(player.id)) {
        return
      }
      if (player.friends === undefined) {
        player.friends = []
      }
      player.friends.push(request.sender)
      await this.playerRepository.save(player)
      await this.onAskFriendsInfo(player)
    } catch (err) {
      this.logger.error(err)
      throw new Error(err)
    }
  }
  async refuseFriendRequest(player: Player, requestId: FriendRequest['id']): Promise<void> {
    try {
      const request = await this.friendRequestRepository.findOneBy({ id: requestId })
      if (!request) {
        return
      }
      if (request.receiver.id !== player.id) {
        throw new UnauthorizedWsException()
      }
      request.answered = true
      request.accepted = false
      await this.friendRequestRepository.save(request)
    } catch (err) {
      this.logger.error(err)
    }
  }
  async getPendingRequest(player: Player): Promise<FriendRequest[]> {
    const pendingRequests = await this.friendRequestRepository.find({
      where: { receiver: player, accepted: false, answered: false },
      relations: { sender: true },
    })
    return pendingRequests
  }

  async getPlayers(
    offset: number = 0,
    size: number = 50,
  ): Promise<[DetailedPlayerDto[], count: number]> {
    const result = await this.playerRepository.findAndCount({
      skip: offset,
      take: size,
      order: { name: 'ASC' },
      relations: {
        room: true,
      },
      select: { email: true, name: true, id: true, avatar: true, role: true, room: { id: true } },
    })
    const players = result[0].map((player) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      role: player.role,
      email: player.email,
      room: player.room?.id,
    }))
    return [players, result[1]]
  }

  async editPlayer(editBody: Partial<Player>, avatar?: MemoryStorageFile): Promise<Player> {
    const formerPlayer = await this.playerRepository.findOneBy({ id: editBody.id })
    // VALIDATION
    // ROLES
    if (formerPlayer.role !== UserRole.GUEST && editBody.role === UserRole.GUEST) {
      throw new BadRequestException("You can't demote a user to a guest Role")
    }
    if (formerPlayer.role === UserRole.GUEST && editBody.role && editBody.role !== UserRole.GUEST) {
      throw new BadRequestException("You can't promote a guest user")
    }
    if (formerPlayer.role === UserRole.GUEST) {
      delete editBody.email
      delete editBody.password
      delete editBody.role
    }
    // FIELDS VALIDITY
    if (editBody.email) {
      if (!this.authService.checkEmailValidity(editBody.email)) {
        throw new BadRequestException('Incorrect email')
      }
    }
    if (editBody.password) {
      if (!this.authService.checkPasswordStrength(editBody.password)) {
        throw new BadRequestException('Weak password')
      }
      editBody.password = await this.authService.hashPassword(editBody.password)
    }
    if (editBody.name && editBody.name.trim() === '') {
      throw new BadRequestException('Player name can not be empty')
    }

    const newEntity = this.playerRepository.merge(formerPlayer, editBody)
    if (avatar) {
      const avatarUrl = await this.commonService.uploadImage(
        avatar,
        formerPlayer.id,
        true,
        'avatar',
        300,
      )
      newEntity.avatar = avatarUrl
    }
    const editedPlayer = await this.playerRepository.save(newEntity)
    return editedPlayer
  }
  async deletePlayer(playerId: string): Promise<void> {
    const player = await this.playerRepository.findBy({ id: playerId })
    if (!player) {
      throw new NotFoundException()
    }
    await this.playerRepository.remove(player)
  }
}
