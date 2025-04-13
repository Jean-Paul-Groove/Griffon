import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'
import { Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { CreateGuestDto, CreateUserDto, PlayerInfoDto } from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'
import { PlayerNotFoundWsException } from '../common/ws/exceptions/playerNotFound'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { CommonService } from '../common/common.service'

// This should be a real class/interface representing a user entity

@Injectable()
export class PlayerService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    private commonService: CommonService,
  ) {}
  private logger = new Logger(PlayerService.name)

  async createGuest(createGuestDto: CreateGuestDto): Promise<Player> {
    if (createGuestDto.name.trim() != '') {
      const userEntity = this.playerRepository.create({
        name: createGuestDto.name,
        isGuest: true,
      })
      const user = await this.playerRepository.save(userEntity)
      this.logger.log('GUEST CREATED')
      return user
    }
  }
  async createUser(createUser: CreateUserDto, avatar?: MemoryStorageFile): Promise<Player> {
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
        throw new BadRequestException()
      }
    }
  }
  async get(playerId: string): Promise<Player | undefined> {
    try {
      const player = await this.playerRepository.findOne({
        where: {
          id: playerId,
        },
        relations: { room: true },
      })
      return player
    } catch (err) {
      this.logger.error(err)
      throw new PlayerNotFoundWsException()
    }
  }
  async getPlayerFromSocket(client: Socket): Promise<Player | undefined> {
    this.authService.validateWsConnexion(client)
    const player = await this.get(client.data.playerId)
    return player
  }
  generatePlayerInfoDto(player: Player, artists: string[]): PlayerInfoDto {
    return new PlayerInfoDto({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      isArtist: artists.includes(player.id),
      isGuest: player.isGuest,
      room: player.room?.id,
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
}
