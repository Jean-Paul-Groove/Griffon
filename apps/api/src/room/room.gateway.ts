import { Logger, UseFilters, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'
import { RoomService } from './room.service'
import { AuthGuard } from '../auth/auth.guard'
import { PlayerService } from '../player/player.service'
import { GameName, PlayerConnectionSuccessDto, WSE } from 'shared'
import { GameService } from '../game/game.service'
import { RoomGuard } from './room.guard'
import { ChatService } from '../chat/chat.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { Roles } from './decorators/roles'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { WsFilter } from '../common/ws/ws.filter'

@UseFilters(new WsFilter())
@UseGuards(AuthGuard)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
  },
  pingTimeout: 60000,
  exceptionFilters: new WsFilter(),
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomService,
    private playerService: PlayerService,
    private gameService: GameService,
    private chatService: ChatService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}
  private readonly logger = new Logger(RoomGateway.name)

  @WebSocketServer()
  io: Server

  afterInit(): void {
    this.roomService.io = this.io
    this.io.disconnectSockets()
    this.logger.log('Room gateway initialized')
  }
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Chek that player is known
      this.logger.debug('HANDLE CONNECT', client.data)
      const player = await this.playerService.getPlayerFromSocket(client)
      this.logger.debug(player?.name)
      // If player was to be removed for iddleness, cancel the timeout
      const timeOutName = `${player.id}::toBeRemoved`
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        this.schedulerRegistry?.doesExist('timeout', timeOutName)
      ) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      this.logger.debug(player)
      // Send the user info
      const playerInfo = this.playerService.generatePlayerInfoDto(player, [])
      const data: PlayerConnectionSuccessDto = {
        event: WSE.CONNECTION_SUCCESS,
        arguments: { player: playerInfo },
      }
      client.emit(data.event, data.arguments)
    } catch (error) {
      this.logger.debug('HANDLE CONNECT ')
      this.logger.error(error)
      client.emit(WSE.INVALID_TOKEN)
      client.disconnect()
    }
  }
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      // Retrieve player associated with socket
      const player = await this.playerService.getPlayerFromSocket(client)
      if (!player) {
        this.logger.warn('SOCKET DISCONNECT WITHOUT A USER')
        return
      }
      if (!player.room) {
        this.logger.warn('PLAYER DISCONNECTED WITHOUT A ROOM')
        return
      }
      // Considered as iddle, player will be removed from room after timeout
      const timeOutName = `${player.id}::toBeRemoved`
      this.logger.debug(this.schedulerRegistry.getTimeouts())
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        this.schedulerRegistry?.doesExist('timeout', timeOutName)
      ) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      const timeOut = setTimeout(() => this.roomService.onDisconnectedClient(client), 60000)
      this.schedulerRegistry.addTimeout(timeOutName, timeOut)
    } catch (err) {
      this.logger.warn('HANDLE DISCONNECT', err)
    }
  }
  // ROOM HANDLERS
  @SubscribeMessage(WSE.ASK_CREATE_ROOM)
  async handleCreateRoom(@ConnectedSocket() client: Socket): Promise<WsResponse> {
    this.logger.debug('ASK CREATE ROOM')
    const player = await this.playerService.get(client.data.playerId)
    return this.roomService.onCreateRoom(player, client)
  }
  @UseFilters(new WsFilter())
  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!roomId) {
      throw new RoomNotFoundWsException()
    }
    const player = await this.playerService.get(client.data.playerId)
    this.logger.debug('ONPLAYERJOIN GATEWAY')
    return this.roomService.onPlayerJoinRoom(player, roomId, client)
  }

  @SubscribeMessage(WSE.ASK_LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this.logger.debug('ASKED TO LEAVE')
    if (!roomId) {
      throw new RoomNotFoundWsException()
    }
    return this.roomService.onPlayerLeaveRoom(client, roomId)
  }

  @SubscribeMessage(WSE.ASK_EXCLUDE_PLAYER)
  @Roles('admin')
  async handleExcludePlayer(
    @MessageBody('playerId') playerId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    return this.roomService.onExcludePlayer(playerId, client.data.roomId)
  }

  // CHAT HANDLERS
  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.NEW_MESSAGE)
  handleNewMessage(
    @MessageBody('message') message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.chatService.onNewChatMessage(message, client)
  }

  // GAME HANDLERS
  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  @Roles('artist')
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Blob,
  ): Promise<WsResponse | void> {
    return this.gameService.onDrawingUpload(client, drawing)
  }

  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.ASK_START_GAME)
  @Roles('admin')
  async handleAskStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('game') game: GameName,
  ): Promise<void> {
    try {
      this.gameService.onAskStartGame(client, game)
    } catch (err) {
      client.emit(WSE.FAIL_START_GAME, { reson: err.message ?? 'An error occured' })
    }
  }
}
