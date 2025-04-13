import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { PlayerService } from '../../player/player.service'
import { Socket } from 'socket.io'
import { RoomService } from '../room.service'
import { Reflector } from '@nestjs/core'
import { RoomNotFoundWsException } from '../../common/ws/exceptions/roomNotFound'
import { AuthService } from '../../auth/auth.service'
import { Room } from '../entities/room.entity'
import { Player } from '../../player/entities/player.entity'
import { WSE } from 'shared'

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
    private roomService: RoomService,
    private reflector: Reflector,
  ) {}
  private readonly logger = new Logger(RoomGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const type = context.getType()
      if (type === 'ws') {
        const client: Socket = context.switchToWs().getClient()
        // Check player has a room
        const player = await this.playerService.getPlayerFromSocket(client)
        if (!player?.room?.id) {
          throw new UnauthorizedException()
        }
        // Check Room exists and has the player registered in
        const room = await this.roomService.get(player.room.id)
        if (!room) {
          throw new RoomNotFoundWsException()
        }
        if (!this.roomService.hasPlayer(room, player.id)) {
          client.data.roomId = undefined
          player.room = null
          throw new UnauthorizedException()
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
        return this.checkRoles(room, player, context)
      }
      if (type === 'http') {
        const request = context.switchToHttp().getRequest()
        const player = await this.playerService.get(
          this.authService.getPlayerIdFromRequest(request),
        )

        const room = await this.roomService.get(player.room.id)
        if (!room) {
          throw new RoomNotFoundWsException()
        }
        return this.checkRoles(room, player, context)
      }
    } catch (error) {
      this.logger.debug('ERROR IN GUARD')
      this.logger.error(error)
      throw new UnauthorizedException()
    }
  }

  checkRoles(room: Room, player: Player, context: ExecutionContext): boolean {
    // Check for role specific routes
    const requiredRoles: string[] = this.reflector.get('roles', context.getHandler())
    if (!requiredRoles) {
      return true
    }
    // ROOM ADMIN RESTRICTED
    if (requiredRoles.includes('admin')) {
      if (room.admin.id !== player.id) {
        return false
      }
    }
    // ROUND ARTIST RESTRICTED
    if (requiredRoles.includes('artist')) {
      const currentRound = room.currentGame?.rounds[0]
      if (
        !currentRound ||
        !currentRound.onGoing ||
        !currentRound.artists ||
        !currentRound.artists.map((artist) => artist.id).includes(player.id)
      ) {
        this.roomService.emitToPlayer(player, { event: WSE.STOP_DRAW, arguments: undefined })
        return false
      }
    }

    return true
  }
}
