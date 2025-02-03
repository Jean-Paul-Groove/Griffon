import { Logger } from '@nestjs/common'
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

import { AuthService } from '../auth/auth.service'
import { Server, Socket } from 'socket.io'
import { RoomService } from './room.service'
import { WSE } from 'wse'
@WebSocketGateway()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private authService: AuthService,
    private roomService: RoomService,
  ) {}
  private readonly logger = new Logger(RoomGateway.name)

  @WebSocketServer() io: Server

  afterInit(): void {
    this.roomService.io = this.io
    this.logger.log('Room gateway initialized')
  }
  handleConnection(client: Socket): void {
    try {
      const user = this.authService.getUserFromSocket(client)
      this.logger.debug('UserRoom')
      this.logger.debug(user?.room)
      if (user && user.room) {
        this.logger.debug('ROOM DETECTED FOR USER ', user.name)
        this.roomService.reconnectUser(user, client)
      }

      const { sockets } = this.io.sockets

      this.logger.log(`Client id: ${client.data.userId} connected`)
      this.logger.debug(`Number of connected clients: ${sockets.size}`)
    } catch (error) {
      this.logger.error(error)
      client.emit(WSE.INVALID_TOKEN)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    this.roomService.onDisconnectedClient(client)
  }

  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse> {
    try {
      const user = this.authService.getUserFromSocket(client)
      if (!user) {
        throw new Error('User not found')
      }
      return this.roomService.onUserJoinRoom(user, roomId, client)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Blob,
  ): Promise<WsResponse> {
    try {
      this.logger.log('Upload detected')
      this.logger.debug(client.data)
      const user = this.authService.getUserFromSocket(client)
      const { id, name } = user
      const room = this.roomService.getRoomFromUser(user)
      this.io.in(room.id).emit(WSE.UPLOAD_DRAWING, { drawing, user: { id, name } })
      return { event: 'SUCCESS', data: undefined }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
