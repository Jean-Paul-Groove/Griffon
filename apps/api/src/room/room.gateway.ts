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
import { WSE } from 'wse'
import { WsFilter } from '../common/ws/ws.filter'
import { AuthGuard } from '../auth/auth.guard'
import { UserService } from '../user/user.service'
import { RoomGuard } from './room.guard'
import { GameName, UserInfoDto } from 'dto'

@UseGuards(AuthGuard)
@UseFilters(WsFilter)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
  },
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomService,
    private userService: UserService,
  ) {}
  private readonly logger = new Logger(RoomGateway.name)

  @WebSocketServer()
  io: Server

  afterInit(): void {
    this.roomService.io = this.io
    this.io.disconnectSockets()
    this.logger.log('Room gateway initialized')
  }
  handleConnection(client: Socket): void {
    try {
      // Chek that user is known
      this.logger.debug('HANDLE CONNECT', client.data)
      const user = this.userService.getUserFromSocket(client)
      const userInfoDto = new UserInfoDto()
      userInfoDto.id = user.id
      userInfoDto.name = user.name
      if (user.avatar !== undefined) {
        userInfoDto.avatar = user.avatar
      }
      client.emit(WSE.CONNECTION_SUCCESS, userInfoDto)
    } catch (error) {
      this.logger.debug('HANDLE CONNECT ')
      this.logger.error(error)
      client.emit(WSE.INVALID_TOKEN)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      this.roomService.onDisconnectedClient(client)
    } catch (err) {
      this.logger.warn('HANDLE DISCONNECT', err)
    }
  }
  // ROOM HANDLERS
  @SubscribeMessage(WSE.ASK_CREATE_ROOM)
  async handleCreateRoom(@ConnectedSocket() client: Socket): Promise<WsResponse> {
    this.logger.debug('ASK CREATE ROOM')
    const user = this.userService.get(client.data.userId)
    return this.roomService.onCreateRoom(user, client)
  }

  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse> {
    const user = this.userService.get(client.data.userId)
    return this.roomService.onUserJoinRoom(user, roomId, client)
  }

  // CHAT HANDLERS

  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.NEW_MESSAGE)
  handleNewMessage(
    @MessageBody('message') message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.roomService.onNewMessage(message, client)
  }

  // GAME HANDLERS
  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Blob,
  ): Promise<WsResponse | void> {
    return this.roomService.onDrawingUpload(client, drawing)
  }

  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.ASK_START_GAME)
  async handleAskStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('game') game: GameName,
  ): Promise<void> {
    this.roomService.onAskStartGame(client, game)
  }
}
