import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { PlayerService } from '../../player/player.service'
import { Socket } from 'socket.io'
import { AuthService } from '../auth.service'
import { UserRole } from 'shared'
import { UnauthorizedWsException } from '../../common/ws/exceptions/unauthorized'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}
  private readonly logger = new Logger(AdminGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const type = context.getType()
      if (type === 'ws') {
        const client: Socket = context.switchToWs().getClient()
        // Check player has a room
        const player = await this.playerService.getPlayerFromSocket(client)
        if (player.role === UserRole.ADMIN) {
          return true
        }
        throw new UnauthorizedWsException()
      }
      if (type === 'http') {
        const request = context.switchToHttp().getRequest()
        const player = await this.playerService.get(
          this.authService.getPlayerIdFromRequest(request),
        )
        if (player.role === UserRole.ADMIN) {
          return true
        }
        throw new UnauthorizedException()
      }
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException()
    }
  }
}
