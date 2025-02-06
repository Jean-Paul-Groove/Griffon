import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { Socket } from 'socket.io'
import { RoomService } from './room.service'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private roomService: RoomService,
  ) {}
  private readonly logger = new Logger(RoomGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('ROOm GUARD')

    try {
      const client: Socket = context.switchToWs().getClient()
      const user = this.userService.getUserFromSocket(client)
      if (!user?.room?.id) {
        return false
      }
      const room = this.roomService.get(user.room.id)
      if (!room || !room.hasUser(user.id)) {
        user.room = undefined
        client.data.roomId = undefined
        return false
      }
      if (user.room.id !== client.data.roomId) {
        client.data.roomId = user.room.id
      }
      const clientRooms = Array.from(client.rooms)
      if (!clientRooms.includes(user.room.id)) {
        client.join(user.room.id)
      }

      return true
    } catch (error) {
      this.logger.debug('ERROR IN GUARD')
      throw new WsException({ status: 401, message: error?.message || 'No access to room' })
    }
  }
}
