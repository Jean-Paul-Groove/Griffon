import { Logger } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { AuthService } from '../auth/auth.service'
import { RoomService } from '../room/room.service'
import { Namespace, Socket } from 'socket.io'

@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private authService: AuthService,
    private roomService: RoomService,
  ) {}
  private readonly logger = new Logger(GameGateway.name)

  @WebSocketServer() io: Namespace

  afterInit(): void {
    this.logger.log('Game gateway initialized')
  }

  handleConnection(client: Socket): void {
    try {
      this.logger.debug(client.data)
    } catch (error) {
      this.logger.error(error)
    }
  }

  handleDisconnect(client: Socket): void {
    this.roomService.onDisconnectedClient(client)
  }
}
