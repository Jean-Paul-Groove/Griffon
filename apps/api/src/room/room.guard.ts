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
    try {
      // Check user has a room
      const client: Socket = context.switchToWs().getClient()
      const user = this.userService.getUserFromSocket(client)
      if (!user?.room?.id) {
        throw new Error('User has not join any room')
      }
      // Check Room exists and has the user registered in
      const room = this.roomService.get(user.room.id)
      if (!room || !room.hasPlayer(user.id)) {
        user.room = undefined
        client.data.roomId = undefined
        throw new Error('Users room is not valid')
      }
      // Set up client metadata
      if (user.room.id !== client.data.roomId) {
        client.data.roomId = user.room.id
      }
      // Join corresponding client room
      const clientRooms = Array.from(client.rooms)
      if (!clientRooms.includes(room.id)) {
        this.roomService.onUserJoinRoom(user, room.id, client)
      }

      return true
    } catch (error) {
      this.logger.debug('ERROR IN GUARD')
      throw new WsException({ status: 401, message: error?.message || 'No access to room' })
    }
  }
}
