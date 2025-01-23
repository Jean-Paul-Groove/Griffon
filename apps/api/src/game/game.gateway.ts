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
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { RoomService } from '../common/room/room.service'
import { UsersService } from '../users/users.service'
@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private jwtService: JwtService,
    private roomService: RoomService,
    private usersService: UsersService,
  ) {}
  private readonly logger = new Logger(GameGateway.name)
  @WebSocketServer() io: Server

  afterInit(): void {
    this.logger.log('Game gateway initialized')
  }
  handleConnection(client: Socket): void {
    try {
      const payload = this.jwtService.verify(
        client.handshake.headers.authorization.split('bearer ')[1],
        {
          secret: process.env.JWT_SECRET,
        },
      )
      console.log('Payload :', payload)
      console.log('id :', payload.id)
      if (payload.id && typeof payload.id === 'string') {
        client.data.userId = payload.id
      } else {
        throw new Error('Invalid credentials')
      }
      console.log('Client Data', client.data)
    } catch (error) {
      this.logger.error(error)
    }
    const { sockets } = this.io.sockets

    this.logger.log(`Client id: ${client.data.userId} connected`)
    this.logger.debug(`Number of connected clients: ${sockets.size}`)
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Cliend id:${client.data.userId} disconnected`)
    this.logger.log(Array.from(client.rooms.entries()))
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse> {
    try {
      const userId: string = client.data.userId
      this.logger.log('USerId :', userId)
      let user = await this.usersService.get(userId)
      if (!user) {
        user = { id: userId, username: 'José Bové' }
      }
      this.logger.log('user :', user)

      const roomExists = this.roomService.hasRoom(roomId)
      if (!roomExists) {
        this.roomService.createRoom(roomId)
      }
      const room = this.roomService.getRoom(roomId)
      this.logger.log('Room :', room)

      room.addUser(user)
      client.join(roomId)
      client.data.roomId = roomId
      console.log('User ', userId, ' joined room :', room)
      return { event: 'yo', data: room }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
