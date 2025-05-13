import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomOptions } from './types/room/RoomOptions'
import { PlayerService } from '../player/player.service'
import { WsException, WsResponse } from '@nestjs/websockets'
import {
  WSE,
  RoomInfoDto,
  PlayerJoinedRoomSuccessDto,
  PlayerReconnectedDto,
  PlayerJoinedRoomDto,
  FailJoinRoomDto,
  RoomStateDto,
  ScoreListDto,
  ScoreDto,
  UserRole,
} from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from './entities/room.entity'
import { Player } from '../player/entities/player.entity'
import { ChatService } from '../chat/chat.service'
import { GameService } from '../game/game.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { Score } from '../game/entities/score.entity'
import { Socket } from 'socket.io'
import { CommonService } from '../common/common.service'

@Injectable()
export class RoomService {
  constructor(
    private playerService: PlayerService,
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    private chatService: ChatService,
    private commonService: CommonService,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Player)
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
  ) {}
  private readonly logger = new Logger(RoomService.name, { timestamp: true })
  private emptyRoomTime = 300000
  // Private methods
  private async create(options?: RoomOptions): Promise<Room> {
    this.logger.debug('ATTEMPTING TO CREATE A ROOM')
    // Room is historized if at least one player has an account
    let historized = false
    if (options.owner && options.owner.role !== UserRole.GUEST) {
      historized = true
    }
    const roomEntity = this.roomRepository.create({
      limit: options?.maxNumPlayer,
      admin: options?.owner,
      players: options?.owner ? [options?.owner] : [],
      historized,
    })
    const room = await this.roomRepository.save(roomEntity)
    return room
  }
  private async deleteRoom(id: string): Promise<void> {
    this.logger.warn('DELETING ROOM')
    this.logger.warn(id)
    const room = new Room()
    room.id = id
    await this.roomRepository.remove(room)
  }
  /**
   * Get a room by id
   * @param {string} id:string The id of the room
   * @returns {Room} Returns a Room entity with admin, an array of players, an array of chatMessages(with senders), an array of scores(with players), currentGame (with specs), currentGame.rounds(with artists and word)
   * The currentGame.rounds array contains only onGoing rounds and should only hold 1 element
   */
  async get(id: string): Promise<Room> {
    try {
      const room = await this.roomRepository
        .createQueryBuilder('room')
        .where('room.id = :id', { id })
        .leftJoinAndSelect('room.players', 'players')
        .leftJoinAndSelect('room.chatMessages', 'chatMessages')
        .leftJoinAndSelect('chatMessages.sender', 'sender')
        .leftJoinAndSelect('room.currentGame', 'currentGame')
        .leftJoinAndSelect('currentGame.specs', 'specs')
        .leftJoinAndSelect('currentGame.scores', 'scores')
        .leftJoinAndSelect('scores.player', 'player')
        .leftJoinAndSelect('room.admin', 'admin')
        .leftJoinAndSelect('currentGame.rounds', 'onGoingRound', 'onGoingRound.onGoing = true')
        .leftJoinAndSelect('onGoingRound.artists', 'artists')
        .leftJoinAndSelect('onGoingRound.haveGuessed', 'haveGuessed')
        .leftJoinAndSelect('onGoingRound.word', 'word')
        .getOne()
      return room
    } catch (err) {
      this.logger.error(err)
      throw new RoomNotFoundWsException()
    }
  }
  hasPlayer(room: Room, playerId: string): boolean {
    if (!room.players) {
      return false
    }
    return room.players.map((player) => player.id).includes(playerId)
  }
  private async addPlayerToRoom(roomId: string, player: Player): Promise<Player> {
    const room = await this.get(roomId)
    if (!room) {
      throw new RoomNotFoundWsException()
    }
    if (this.hasPlayer(room, player.id)) {
      this.logger.warn('Player already in Room')
    } else {
      // If room didn't have any admin, set user as new admin
      if (room.admin === null) {
        room.admin = player
      }

      if (room.players) {
        if (room.players.length >= room.limit) {
          throw new WsException('room-full')
        }
        room.players.push(player)
      } else {
        room.players = [player]
      }
    }
    // Room is historized if at least one player has an account
    if (player.role !== UserRole.GUEST && room.historized === false) {
      room.historized = true
    }
    await this.roomRepository.save(room)
    this.sendRoomState(room)
    if (room.currentGame?.onGoing && room.currentGame.rounds.length > 0) {
      this.gameService.handleReconnexionDuringGame(player, room, room.currentGame.rounds[0])
    }
    // If room was set  to be deleted, remove the timeout
    if (
      this.schedulerRegistry &&
      this.schedulerRegistry.doesExist !== undefined &&
      this.schedulerRegistry.doesExist('timeout', `${room.id}::toBeRemoved`)
    ) {
      const timeOut = this.schedulerRegistry.getTimeout(`${room.id}::toBeRemoved`)
      clearTimeout(timeOut)
      this.schedulerRegistry.deleteTimeout(`${room.id}::toBeRemoved`)
    }
    return player
  }
  /**
   * Removes a player from a room. If he was the admin, sets a new admin. Disconnect player's socket from room events.
   * If room is empty, sets a timer to delete it, default 5mn.
   * @param {Room} room:Room The room from which to remove the player
   * @param {string} playerId:string The id of the player to be removed
   * @returns {Promise<Room>}
   */
  private async removePlayerFromRoom(room: Room, playerId: string): Promise<Room> {
    this.logger.debug('REMOVING USER FROM ROOM')
    this.logger.debug(room)
    // Remove player from room
    if (room.players) {
      this.logger.debug('PLAYERS IN ROOM')
      this.logger.debug(room.players)
      room.players = room.players.filter((player) => player.id !== playerId)
      // If was admin, set a new one
      if (room.admin.id === playerId) {
        room.admin = room.players.length > 0 ? room.players[0] : null
      }
      await this.roomRepository.save(room)
    }

    // Disconnect socket from room
    const playerSocket = this.commonService.getSocketFromPlayer(playerId)
    this.commonService.removeSocketFromRoom(playerSocket, room.id)

    // If no more players and room is not to be historized, set room to be deleted after 5mn
    if (room.players === null || (room.players.length === 0 && room.historized === false)) {
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        !this.schedulerRegistry?.doesExist('timeout', `${room.id}::toBeRemoved`)
      ) {
        const timeOut = setTimeout(async () => {
          try {
            this.logger.fatal('ROOM IS BEING DELETED')
            this.logger.fatal(room.id)
            await this.deleteRoom(room.id)
          } catch (err) {
            this.logger.error(err)
          }
        }, this.emptyRoomTime)
        this.schedulerRegistry.addTimeout(`${room.id}::toBeRemoved`, timeOut)
      }
    }
    return room
  }

  private async getRoomScores(room: Room): Promise<ScoreDto[]> {
    try {
      const scores: ScoreDto[] = await this.scoreRepository
        .createQueryBuilder('score')
        .select('player.id', 'player')
        .addSelect('SUM(score.points)', 'points')
        .innerJoin('score.player', 'player')
        .innerJoin('score.game', 'game')
        .innerJoin('game.room', 'room')
        .where('room.id = :roomId', { roomId: room.id })
        .groupBy('player.id')
        .addGroupBy('player.name')
        .getRawMany()
      return scores
    } catch (err) {
      this.logger.debug(err)
    }
  }
  async sendScore(room: Room): Promise<void> {
    try {
      const roomScores = await this.getRoomScores(room)
      const data: ScoreListDto = {
        event: WSE.SCORE_LIST,
        arguments: {
          scores: roomScores,
        },
      }
      this.commonService.emitToRoom(room.id, data)
    } catch (error) {
      this.logger.error(error)
    }
  }
  // Handlers
  async onCreateRoom(
    player: Player,
    client: Socket,
  ): Promise<WsResponse<PlayerJoinedRoomSuccessDto['arguments']>> {
    try {
      if (player.room) {
        await this.removePlayerFromRoom(player.room, player.id)
      }
      const room = await this.create({ owner: player })
      // Join socket to room
      this.logger.debug('ROOM CREATED')
      this.commonService.joinSocketToRoom(client, room.id)

      return {
        event: WSE.USER_JOINED_ROOM_SUCCESS,
        data: { room: await this.generateRoomInfoDto(room) },
      }
    } catch (error) {
      this.logger.error(error)
      client.emit(WSE.FAIL_CREATE_ROOM, { reson: error.message ?? 'An error occured' })
    }
  }
  async onPlayerJoinRoom(player: Player, roomId: string, client: Socket): Promise<void> {
    try {
      // Check if room exists
      const room = await this.get(roomId)
      if (!room) {
        throw new RoomNotFoundWsException()
      }
      this.logger.debug('JOINING ROOM')
      this.logger.debug(player.name)
      this.logger.debug('In room' + roomId)
      this.addPlayerToRoom(roomId, player)
      this.commonService.joinSocketToRoom(client, roomId)

      this.logger.debug('FATCHED ROOM')
      const playerInfo = this.playerService.generatePlayerInfoDto(player, [])
      // Check if player already has a room
      if (player.room && player.room.id === roomId) {
        this.logger.debug('PLAYER WAS IN ROOM')
        // If it's the same room, treat as reconnexion
        const reconnexionData: PlayerReconnectedDto = {
          event: WSE.USER_RECONNECTED,
          arguments: { player: playerInfo },
        }
        this.commonService.emitToRoom(roomId, reconnexionData)
      }

      const userJoinedData: PlayerJoinedRoomDto = {
        event: WSE.USER_JOINED_ROOM,
        arguments: { player: playerInfo },
      }
      this.commonService.emitToRoom(roomId, userJoinedData)
    } catch (exception) {
      const data: FailJoinRoomDto = {
        event: WSE.FAIL_JOIN_ROOM,
        arguments: { reason: exception.message },
      }
      this.commonService.emitToPlayer(player.id, data)
      this.logger.error(exception)
    }
  }
  async onDisconnectedClient(client: Socket): Promise<void> {
    this.logger.log(`Cliend id:${client.data.playerId} disconnected`)
    const player = await this.playerService.getPlayerFromSocket(client)
    if (!player) {
      return
    }
    const room = await this.getRoomFromPlayer(player)
    this.logger.debug('ON DISCONNECT')
    if (!room) {
      this.logger.debug('NO ROOM')
      return
    }
    const updtatedRoom = await this.removePlayerFromRoom(room, player.id)
    if (updtatedRoom.players?.length > 0) {
      // Send Room State to remaining players
      this.sendRoomState(updtatedRoom)
    }
  }
  async onPlayerLeaveRoom(client: Socket, roomId: string): Promise<void> {
    try {
      const { playerId } = client.data
      const room = await this.get(roomId)
      const updatedRoom = await this.removePlayerFromRoom(room, playerId)
      this.sendRoomState(updatedRoom)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async onExcludePlayer(playerId: string, roomId: string): Promise<void> {
    try {
      const room = await this.get(roomId)
      const updatedRoom = await this.removePlayerFromRoom(room, playerId)
      const player = await this.playerService.get(playerId)
      this.commonService.emitToPlayer(player.id, {
        event: WSE.ROOM_STATE,
        arguments: { room: null },
      })
      this.sendRoomState(updatedRoom)
    } catch (error) {
      this.logger.error(error)
    }
  }
  // Services
  async generateRoomInfoDto(room: Room): Promise<RoomInfoDto> {
    this.logger.debug('GENERATEROOMINFODTO')
    let round = null
    if (room.currentGame != null) {
      const gameRoom = new Room()
      gameRoom.id = room.id
      room.currentGame.room = gameRoom
      if (room.currentGame.rounds.length > 0) {
        round = room.currentGame.rounds[0]
      }
    }
    const scores = await this.getRoomScores(room)
    return new RoomInfoDto({
      id: room.id,
      admin: room.admin?.id ?? null,
      players: room.players
        ? room.players.map((player) =>
            this.playerService.generatePlayerInfoDto(
              player,
              round != null ? round.artists.map((artist) => artist.id) : [],
            ),
          )
        : [],
      chatMessages: room.chatMessages
        ? room.chatMessages.map((chat) => this.chatService.generateChatMessageDto(chat))
        : [],
      limit: room.limit,
      currentGame:
        room.currentGame != null ? this.gameService.generateGameInfoDto(room.currentGame) : null,
      // TODO CHECK THIS
      scores,
    })
  }
  async sendRoomState(room: Room, player?: Player): Promise<void> {
    try {
      const data: RoomStateDto = {
        event: WSE.ROOM_STATE,
        arguments: { room: await this.generateRoomInfoDto(room) },
      }
      this.commonService.emitToRoom(room.id, data)
      if (player) {
        this.commonService.emitToPlayer(player.id, data)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
  async getRoomFromPlayer(player: Player): Promise<Room | undefined> {
    if (player.room) {
      return await this.get(player.room.id)
    }
  }
}
