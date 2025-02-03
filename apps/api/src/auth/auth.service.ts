import { Injectable, Logger } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { User } from '../users/types/User'
import { WsException } from '@nestjs/websockets'
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name)
  private validateWsConnexion(client: Socket): Socket {
    const payload = this.jwtService.verify(client.handshake.auth.token.split('bearer ')[1], {
      secret: process.env.JWT_SECRET,
    })
    if (payload.id.trim() !== '') {
      client.data.userId = payload.id
    } else {
      throw new WsException('Invalid credentials.')
    }
    return client
  }
  getUserFromSocket(client: Socket): User {
    this.validateWsConnexion(client)
    this.logger.debug(client.data.userId)
    const user = this.usersService.get(client.data.userId)
    if (!user) {
      throw new WsException({ message: 'User not found.', status: 404 })
    }
    return user
  }
  async signInAsGuest(username: string): Promise<{ access_token: string }> {
    this.logger.debug(username)
    const user = this.usersService.createUser(username)
    const payload = { id: user.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
