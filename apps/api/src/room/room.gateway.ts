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
    } catch (error) {
      this.logger.error(error)
    }
    const { sockets } = this.io.sockets

    this.logger.log(`Client id: ${client.data.userId} connected`)
    this.logger.debug(`Number of connected clients: ${sockets.size}`)
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
}
