import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { PlayerService } from '../player/player.service'
import { Socket } from 'socket.io'
import { RoomService } from './room.service'
import { WsException } from '@nestjs/websockets'

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(
    private playerService: PlayerService,
    private roomService: RoomService,
  ) {}
  private readonly logger = new Logger(RoomGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Check player has a room
      const client: Socket = context.switchToWs().getClient()
      this.logger.debug(client.data)
      const player = await this.playerService.getPlayerFromSocket(client)
      if (!player?.room?.id) {
        throw new Error('Player has not joined any room')
      }
      // Check Room exists and has the player registered in
      const room = await this.roomService.get(player.room.id)
      if (!room) {
        throw new Error("Room doesn't exist")
      }
      if (!(await this.roomService.hasPlayer(room, player.id))) {
        player.room = undefined
        client.data.roomId = undefined
        throw new Error('Player room is not valid')
      }
      // Set up client metadata
      if (player.room.id !== client.data.roomId) {
        client.data.roomId = player.room.id
      }

      // Join corresponding client room
      const clientRooms = Array.from(client.rooms)
      if (!clientRooms.includes(player.room.id)) {
        this.roomService.onPlayerJoinRoom(player, player.room.id, client)
      }

      return true
    } catch (error) {
      this.logger.debug('ERROR IN GUARD')
      throw new WsException({ status: 401, message: error?.message || 'No access to room' })
    }
  }
}
