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
} from 'shared'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Room } from './entities/room.entity'
import { Player } from '../player/entities/player.entity'
import { ChatService } from '../chat/chat.service'
import { GameService } from '../game/game.service'
import { Round } from '../game/entities/round.entity'

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
    private playerRepository: Repository<Player>,
  ) {}
  public io: Server
  private readonly logger = new Logger(RoomService.name, { timestamp: true })

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
    const room = new Room()
    room.id = id
    await this.roomRepository.remove(room)
  }
  async get(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        players: true,
        chatMessages: { sender: true },
        currentGame: { specs: true },
        scores: { player: true },
        admin: true,
      },
    })
    this.logger.debug('GETTING ROOM')
    return room
  }
  hasPlayer(room: Room, playerId: string): boolean {
    if (!room.players) {
      return false
    }
    return room.players.map((player) => player.id).includes(playerId)
  }
  private async addPlayerToRoom(roomId: string, player: Player): Promise<Player> {
    const room = await this.get(roomId)
    if (this.hasPlayer(room, player.id)) {
      this.logger.warn('Player already in Room')
      return player
    }
    if (room.players) {
      room.players.push(player)
    } else {
      room.players = [player]
    }
    this.roomRepository.save(room)
    return player
  }
  private async removePlayerFromRoom(room: Room, playerId: string): Promise<void> {
    this.logger.debug('REMOVING USER FROM ROOM')
    if (room.players) {
      room.players = room.players.filter((player) => player.id !== playerId)
      await this.roomRepository.save(room)
    }
  }
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
        data: { room: this.generateRoomInfoDto(room, null) },
      }
    } catch (error) {
      client.emit(WSE.FAIL_CREATE_ROOM, { reson: error.message ?? 'An error occured' })
    }
  }
  async onPlayerJoinRoom(
    player: Player,
    roomId: string,
    client: Socket,
  ): Promise<WsResponse<PlayerJoinedRoomSuccessDto['arguments']>> {
    try {
      // Check if room exists
      this.logger.debug('JOINING ROOM')
      this.logger.debug(player.name)
      this.logger.debug('In room' + roomId)
      const room = await this.get(roomId)
      if (!room) {
        throw new WsException('Room not found')
      }
      this.logger.debug('FATCHED ROOM')
      const playerInfo = this.playerService.generatePlayerInfoDto(player, [])
      // Check if player already has a room
      if (player.room) {
        this.logger.debug('PLAYER HAS ROOM')
        // If it's the same room, treat as reconnexion
        if (player.room.id === roomId) {
          this.logger.debug('PLAYER ROOM ID === ROOM ID')
          this.logger.debug(JSON.stringify(room.players))
          if (room.players.find((player) => player.id === player.id)) {
            this.joinSocketToRoom(client, room.id)
            this.logger.debug(room.admin)
            const reconnexionData: PlayerReconnectedDto = {
              event: WSE.USER_RECONNECTED,
              arguments: { player: playerInfo },
            }
            this.emitToRoom(room.id, reconnexionData)
          }
          let round
          if (room.currentGame?.onGoing) {
            round = await this.gameService.getLastOngoingORound(room.currentGame)
          }
          const roomInfo = this.generateRoomInfoDto(room, round)
          return {
            event: WSE.USER_JOINED_ROOM_SUCCESS,
            data: { room: roomInfo },
          }
        }
        this.logger.debug('PASSED CONDITION')
      }

      this.addPlayerToRoom(roomId, player)

      this.joinSocketToRoom(client, roomId)

      const userJoinedData: PlayerJoinedRoomDto = {
        event: WSE.USER_JOINED_ROOM,
        arguments: { player: playerInfo },
      }

      this.emitToRoom(room.id, userJoinedData)
      let round
      if (room.currentGame?.onGoing) {
        round = await this.gameService.getLastOngoingORound(room.currentGame)
      }
      const roomInfo = this.generateRoomInfoDto(room, round)
      return { event: WSE.USER_JOINED_ROOM_SUCCESS, data: { room: roomInfo } }
    } catch (exception) {
      const data: FailJoinRoomDto = { event: WSE.FAIL_JOIN_ROOM, arguments: { reason: exception } }
      this.emitToPlayer(player, data)
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
    if (room.admin?.id === player.id) {
      this.logger.debug('USER WAS ADMIN')

      room.admin = null
      await this.roomRepository.save(room)
      player.room = null
      await this.playerRepository.save(player)
      await this.setNewAdminOrDelete(room.id)
    } else {
      await this.removePlayerFromRoom(room, player.id)
    }
  }

  // Services
  getSocketFromPlayer(playerId: string): Socket | undefined {
    const sockets = this.io.sockets.sockets

    return (Array.from(sockets.values()) as Socket[]).find(
      (socket) => socket.data.playerId === playerId,
    )
  }
  generateRoomInfoDto(room: Room, round: Round | null): RoomInfoDto {
    this.logger.debug('GENERATEROOMINFODTO')
    if (room.currentGame) {
      const gameRoom = new Room()
      gameRoom.id = room.id
      room.currentGame.room = gameRoom
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
      currentGame: room.currentGame ? this.gameService.generateGameInfoDto(room.currentGame) : null,
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
  async getRoomFromPlayer(player: Player): Promise<Room | undefined> {
    if (player.room) {
      return await this.get(player.room.id)
    }
  }
  async setNewAdminOrDelete(roomId: string): Promise<void> {
    this.logger.debug('SETTING NEW ADMIN OR DELETE')

    const room = await this.get(roomId)
    if (room.players.length > 0) {
      room.admin = room.players[0]
      await this.roomRepository.save(room)
    }
  }
  emitToRoom(roomId: string, data: SocketDto): void {
    this.io.in(roomId).emit(data.event, data.arguments)
  }

  emitToPlayer(player: Player, data: SocketDto): void {
    const client = this.getSocketFromPlayer(player.id)
    if (!client) {
      throw new Error(`Socket not found for ${player.name}`)
    }
    client.emit(data.event, data.arguments)
  }
}
