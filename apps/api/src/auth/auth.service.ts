import { Injectable, Logger } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { User } from '../users/types/User'
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name)
  private checkUserWSConnection(client: Socket): Socket {
    try {
      this.logger.debug(client.handshake.auth.token)
      const payload = this.jwtService.verify(client.handshake.auth.token.split('bearer ')[1], {
        secret: process.env.JWT_SECRET,
      })
      if (payload.id.trim() !== '') {
        client.data.userId = payload.id
      } else {
        throw new Error('Invalid token payload')
      }
      return client
    } catch (error) {
      this.logger.error(error)
    }
  }
  getUserFromSocket(client: Socket): User | undefined {
    try {
      this.checkUserWSConnection(client)
      return this.usersService.get(client.data.userId)
    } catch (error) {
      this.logger.error(error)
    }
  }
  async signInAsGuest(username: string): Promise<{ access_token: string }> {
    try {
      this.logger.debug(username)
      const user = this.usersService.createUser(username)
      const payload = { id: user.id }
      return {
        access_token: this.jwtService.sign(payload),
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
}
