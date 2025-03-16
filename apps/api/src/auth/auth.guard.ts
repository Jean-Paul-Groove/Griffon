import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Socket } from 'socket.io'
import { AuthService } from './auth.service'
import { WsException } from '@nestjs/websockets'
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  private readonly logger = new Logger(AuthGuard.name)

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient()
      const hasToken = this.authService.validateWsConnexion(client)
      return hasToken
    } catch (error) {
      this.logger.error(error)
      throw new WsException({ status: 401, message: error?.message || 'No valid Token' })
    }
  }
}
