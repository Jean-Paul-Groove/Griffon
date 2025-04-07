import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomOptions } from './types/room/RoomOptions'
import { Server, Socket } from 'socket.io'
import { PlayerService } from '../player/player.service'
import { WsException, WsResponse } from '@nestjs/websockets'
import {
  WSE,
  SocketDto,
  RoomInfoDto,
  PlayerJoinedRoomSuccessDto,
  PlayerReconnectedDto,
  PlayerJoinedRoomDto,
  FailJoinRoomDto,
  RoomStateDto,
} from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from './entities/room.entity'
import { Player } from '../player/entities/player.entity'
import { ChatService } from '../chat/chat.service'
import { GameService } from '../game/game.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'

@Injectable()
export class RoomService {
  constructor(
    private playerService: PlayerService,
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    private chatService: ChatService,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Player)
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}
  public io: Server
  private readonly logger = new Logger(RoomService.name, { timestamp: true })
  private emptyRoomTime = 300000
  // Private methods
  private async create(options?: RoomOptions): Promise<Room> {
    this.logger.debug('ATTEMPTING TO CREATE A ROOM')
    const roomEntity = this.roomRepository.create({
      limit: options?.maxNumPlayer,
      admin: options?.owner,
      players: options?.owner ? [options?.owner] : [],
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
        .leftJoinAndSelect('room.scores', 'scores')
        .leftJoinAndSelect('scores.player', 'player')
        .leftJoinAndSelect('room.currentGame', 'currentGame')
        .leftJoinAndSelect('currentGame.specs', 'specs')
        .leftJoinAndSelect('room.admin', 'admin')
        .leftJoinAndSelect('currentGame.rounds', 'onGoingRound', 'onGoingRound.onGoing = true')
        .leftJoinAndSelect('onGoingRound.artists', 'artists')
        .leftJoinAndSelect('onGoingRound.haveGuessed', 'haveGuessed')
        .leftJoinAndSelect('onGoingRound.word', 'word')
        .getOne()
      return room
    } catch (error) {
      this.logger.error(error)
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
    const playerSocket = this.getSocketFromPlayer(playerId)
    this.removeSocketFromRoom(playerSocket, room.id)

    // If no more players, set room to be deleted after 5mn
    if (room.players === null || room.players.length === 0) {
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        !this.schedulerRegistry?.doesExist('timeout', `${room.id}::toBeRemoved`)
      ) {
        const timeOut = setTimeout(() => {
          this.logger.fatal('ROOM IS BEING DELETED')
          this.logger.fatal(room.id)
          this.deleteRoom(room.id)
        }, this.emptyRoomTime)
        this.schedulerRegistry.addTimeout(`${room.id}::toBeRemoved`, timeOut)
      }
    }
    return room
  }
  /**
   * Subscribe the player's socket to the room events
   * @param {Socket} client:Socket
   * @param {string} newRoomId:string
   * @returns {void}
   */
  private joinSocketToRoom(client: Socket, newRoomId: string): void {
    // Leave previous socket room if any
    if (client.data.roomId !== newRoomId) {
      client.leave(client.data.roomId)
      client.data.roomId = newRoomId
    }
    // Join new one
    client.join(newRoomId)
    this.logger.debug('PLAYER JOINED SOCKET')
  }
  /**
   * Unsubscribe a socket from a room events
   * @param {Socket} client:Socket Socket to unsubscribe
   * @param {string} roomId:string Id of the room
   * @returns {void}
   */
  private removeSocketFromRoom(client: Socket, roomId: string): void {
    if (client.data.roomId) {
      client.data.roomId = null
    }
    client.leave(roomId)
  }

  // Handlers
  async onCreateRoom(
    player: Player,
    client: Socket,
  ): Promise<WsResponse<PlayerJoinedRoomSuccessDto['arguments']>> {
    try {
      const room = await this.create({ owner: player })
      // Join socket to room
      this.joinSocketToRoom(client, room.id)

      this.logger.debug('ROOM CREATED')
      return {
        event: WSE.USER_JOINED_ROOM_SUCCESS,
        data: { room: this.generateRoomInfoDto(room) },
      }
    } catch (error) {
      client.emit(WSE.FAIL_CREATE_ROOM, { reson: error.message ?? 'An error occured' })
    }
  }
  async onPlayerJoinRoom(player: Player, roomId: string, client: Socket): Promise<void> {
    try {
      // Check if room exists
      this.logger.debug('JOINING ROOM')
      this.logger.debug(player.name)
      this.logger.debug('In room' + roomId)
      this.addPlayerToRoom(roomId, player)
      this.joinSocketToRoom(client, roomId)

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
        this.emitToRoom(roomId, reconnexionData)
      }

      const userJoinedData: PlayerJoinedRoomDto = {
        event: WSE.USER_JOINED_ROOM,
        arguments: { player: playerInfo },
      }
      this.emitToRoom(roomId, userJoinedData)
    } catch (exception) {
      const data: FailJoinRoomDto = { event: WSE.FAIL_JOIN_ROOM, arguments: { reason: exception } }
      this.emitToPlayer(player, data)
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
      this.emitToPlayer(player, { event: WSE.ROOM_STATE, arguments: { room: null } })
      this.sendRoomState(updatedRoom)
    } catch (error) {
      this.logger.error(error)
    }
  }
  // Services
  getSocketFromPlayer(playerId: string): Socket | undefined {
    const sockets = this.io.sockets.sockets

    return (Array.from(sockets.values()) as Socket[]).find(
      (socket) => socket.data.playerId === playerId,
    )
  }
  generateRoomInfoDto(room: Room): RoomInfoDto {
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
      scores: room.scores
        ? room.scores.map((score) => ({
            id: score.id,
            player: score.player.id,
            points: score.points,
            room: room.id,
          }))
        : [],
    })
  }
  async sendRoomState(room: Room, player?: Player): Promise<void> {
    const data: RoomStateDto = {
      event: WSE.ROOM_STATE,
      arguments: { room: this.generateRoomInfoDto(room) },
    }
    this.emitToRoom(room.id, data)
    if (player) {
      this.emitToPlayer(player, data)
    }
  }
  async getRoomFromPlayer(player: Player): Promise<Room | undefined> {
    if (player.room) {
      return await this.get(player.room.id)
    }
  }
  emitToRoom(roomId: string, data: SocketDto): void {
    this.io.in(roomId).emit(data.event, data.arguments)
  }
  emitToPlayer(player: Player, data: SocketDto): void {
    const client = this.getSocketFromPlayer(player.id)
    if (!client) {
      return
    }
    client.emit(data.event, data.arguments)
  }
}
