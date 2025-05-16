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
import { AuthGuard } from '../auth/auth.guard'
import { PlayerService } from '../player/player.service'
import { GameName, PlayerConnectionSuccessDto, WSE } from 'shared'
import { GameService } from '../game/game.service'
import { RoomGuard } from './guards/room.guard'
import { ChatService } from '../chat/chat.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { RoomNotFoundWsException } from '../common/ws/exceptions/roomNotFound'
import { WsFilter } from '../common/ws/ws.filter'
import { Throttle } from '@nestjs/throttler'
import { DrawingGuard } from './guards/drawing.guard'
import { Roles } from '../common/decorators/roles'
import { CommonService } from '../common/common.service'
import { RoomService } from '../room/room.service'
import { Player } from '../player/entities/player.entity'
import { RegisteredGuard } from '../auth/guards/registered.guard'
import { MessageService } from '../message/message.service'

@UseFilters(new WsFilter())
@UseGuards(AuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONT_URL,
    credentials: true,
  },
  pingTimeout: 120000,
})
export class CommonGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomService,
    private playerService: PlayerService,
    private gameService: GameService,
    private chatService: ChatService,
    private commonService: CommonService,
    private messageService: MessageService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}
  private readonly logger = new Logger(CommonGateway.name)

  @WebSocketServer()
  io: Server

  // Initialization of the gateway
  afterInit(): void {
    this.playerService.resetPlayerRooms()
    this.gameService.resetGames()
    this.commonService.io = this.io
    this.io.disconnectSockets()
    this.logger.log('Room gateway initialized')
  }

  // Handler for socket connection
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Chek that player is known
      const player = await this.playerService.getPlayerFromSocket(client, true)
      // If player was to be removed for iddleness, cancel the timeout
      const timeOutName = `${player.id}::toBeRemoved`
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        this.schedulerRegistry?.doesExist('timeout', timeOutName)
      ) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      // Send the user info
      const playerInfo = this.playerService.generatePlayerInfoDto(player, [], true)
      const data: PlayerConnectionSuccessDto = {
        event: WSE.CONNECTION_SUCCESS,
        arguments: { player: playerInfo },
      }
      client.emit(data.event, data.arguments)
    } catch (error) {
      this.logger.error(error)
      client.emit(WSE.INVALID_TOKEN)
      client.disconnect()
    }
  }

  // Handler for socket disconnection
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      // Retrieve player associated with socket
      const player = await this.playerService.getPlayerFromSocket(client)
      if (!player) {
        return
      }
      if (!player.room) {
        return
      }
      // Considered as iddle, player will be removed from room after timeout
      const timeOutName = `${player.id}::toBeRemoved`
      if (
        this.schedulerRegistry?.doesExist !== undefined &&
        this.schedulerRegistry?.doesExist('timeout', timeOutName)
      ) {
        this.schedulerRegistry.deleteTimeout(timeOutName)
      }
      const timeOut = setTimeout(() => this.roomService.onDisconnectedClient(client), 60000)
      this.schedulerRegistry.addTimeout(timeOutName, timeOut)
    } catch (err) {
      this.logger.error('HANDLE DISCONNECT', err)
    }
  }

  // ROOM HANDLERS
  @SubscribeMessage(WSE.ASK_CREATE_ROOM)
  async handleCreateRoom(@ConnectedSocket() client: Socket): Promise<WsResponse> {
    const player = await this.playerService.get(client.data.playerId)
    return this.roomService.onCreateRoom(player, client)
  }

  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!roomId) {
      throw new RoomNotFoundWsException()
    }
    const player = await this.playerService.get(client.data.playerId)
    return await this.roomService.onPlayerJoinRoom(player, roomId, client)
  }

  @SubscribeMessage(WSE.ASK_LEAVE_ROOM)
  async handleLeaveRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!roomId) {
      throw new RoomNotFoundWsException()
    }
    return await this.roomService.onPlayerLeaveRoom(client, roomId)
  }

  @SubscribeMessage(WSE.ASK_EXCLUDE_PLAYER)
  @Roles('room-admin')
  async handleExcludePlayer(
    @MessageBody('playerId') playerId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    return await this.roomService.onExcludePlayer(playerId, client.data.roomId)
  }

  // CHAT HANDLERS
  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.NEW_CHAT_MESSAGE)
  async handleNewChatMessage(
    @MessageBody('message') message: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.chatService.onNewChatMessage(message, client)
  }

  // MESSAGE HANDLERS
  @UseGuards(RegisteredGuard)
  @SubscribeMessage(WSE.NEW_PRIVATE_MESSAGE)
  async handleNewPrivateMessage(
    @MessageBody('message') message: string,
    @MessageBody('receiver') receiver: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.messageService.onNewMessage(message, client, receiver)
  }

  // GAME HANDLERS
  @UseGuards(RoomGuard)
  @UseGuards(DrawingGuard)
  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  @Roles('artist')
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Buffer,
  ): Promise<WsResponse | void> {
    return await this.gameService.onDrawingUpload(client, drawing)
  }

  @UseGuards(RoomGuard)
  @Throttle({ 'start-game': { ttl: 2000, limit: 1 } })
  @SubscribeMessage(WSE.ASK_START_GAME)
  @Roles('room-admin')
  async handleAskStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('game') game: GameName,
  ): Promise<void> {
    try {
      await this.gameService.onAskStartGame(client, game)
    } catch (err) {
      client.emit(WSE.FAIL_START_GAME, { reson: err.message ?? 'An error occured' })
    }
  }

  // PLAYER HANDLERS
  @SubscribeMessage(WSE.ASK_ADD_FRIEND)
  async requestFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody('playerId') playerId: Player['id'],
  ): Promise<void> {
    const player = await this.playerService.getPlayerFromSocket(client, true)
    await this.playerService.requestFriend(player, playerId)
  }

  @UseGuards(RegisteredGuard)
  @SubscribeMessage(WSE.ASK_FRIENDS_INFO)
  async getFriendsInfo(@ConnectedSocket() client: Socket): Promise<void> {
    const player = await this.playerService.getPlayerFromSocket(client, true)
    await this.playerService.onAskFriendsInfo(player)
  }
}
