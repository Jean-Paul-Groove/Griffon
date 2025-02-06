import { Logger, UseFilters, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets'
import { Namespace, Socket } from 'socket.io'
import { RoomService } from '../room/room.service'
import { UserService } from '../user/user.service'
import { AuthGuard } from '../auth/auth.guard'
import { WsFilter } from '../common/ws/ws.filter'
import { WSE } from 'wse'
import { Message } from '../common/message/types/Message'
import { RoomGuard } from '../room/room.guard'

@UseGuards(RoomGuard, AuthGuard)
@UseFilters(WsFilter)
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayInit {
  constructor(
    private roomService: RoomService,
    private userService: UserService,
  ) {}
  private readonly logger = new Logger(ChatGateway.name)

  @WebSocketServer() io: Namespace

  afterInit(): void {
    this.logger.log('Room gateway initialized')
  }
  @SubscribeMessage(WSE.NEW_MESSAGE)
  handleNewMessage(
    @MessageBody('message') message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const user = this.userService.get(client.data.userId)
    const room = this.roomService.getRoomFromUser(user)
    const newMessage: Message = { sender: user, content: message, sent_at: Date.now() }
    room.addMessage(newMessage)
    this.io.in(room.id).emit(WSE.NEW_MESSAGE, newMessage)
  }
}
