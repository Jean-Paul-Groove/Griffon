import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { PlayerService } from '../player/player.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { CreateGuestDto } from 'shared'
import { InvalidCredentialsWsException } from '../common/ws/exceptions/invalidCredentials'
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => PlayerService))
    private playerService: PlayerService,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name)
  validateWsConnexion(client: Socket): boolean {
    const payload = this.jwtService.verify(client.handshake.auth.token.split('bearer ')[1], {
      secret: process.env.JWT_SECRET,
    })
    if (payload.id.trim() !== '') {
      client.data.playerId = payload.id
    } else {
      throw new InvalidCredentialsWsException()
    }
    return true
  }
  async signInAsGuest(name: string): Promise<{ access_token: string }> {
    const guest: CreateGuestDto = { name: name, isGuest: true }
    const player = await this.playerService.createGuest(guest)
    const payload = { id: player.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
