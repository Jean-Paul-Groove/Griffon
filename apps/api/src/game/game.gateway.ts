import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer() io: Server;

  afterInit(): void {
    this.logger.log('Game gateway initialized');
  }

  handleConnection(client: Socket): void {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody('roomId') roomId,
    @ConnectedSocket() client: Socket,
  ): string {
    console.log(client);
    console.log(roomId);
    return 'Hello world!';
  }
}
