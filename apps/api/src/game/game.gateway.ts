import { Logger, UseFilters, UseGuards } from '@nestjs/common'
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { RoomService } from '../room/room.service'
import { Namespace } from 'socket.io'
import { UserService } from '../user/user.service'
import { AuthGuard } from '../auth/auth.guard'
import { WsFilter } from '../common/ws/ws.filter'

@UseGuards(AuthGuard)
@UseFilters(WsFilter)
@WebSocketGateway({ namespace: 'game' })
export class GameGateway implements OnGatewayInit {
  constructor(
    private roomService: RoomService,
    private userService: UserService,
  ) {}
  private readonly logger = new Logger(GameGateway.name)

  @WebSocketServer() io: Namespace

  afterInit(): void {
    this.logger.log('Game gateway initialized')
  }
}
