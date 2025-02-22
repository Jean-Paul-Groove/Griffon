import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { UserService } from '../user/user.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { WsException } from '@nestjs/websockets'
import { CreateUserDto } from 'dto'
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name)
  validateWsConnexion(client: Socket): boolean {
    const payload = this.jwtService.verify(client.handshake.auth.token.split('bearer ')[1], {
      secret: process.env.JWT_SECRET,
    })
    if (payload.id.trim() !== '') {
      client.data.userId = payload.id
    } else {
      throw new WsException({ status: 401, message: 'Invalid credentials.' })
    }
    return true
  }
  async signInAsGuest(username: string): Promise<{ access_token: string }> {
    this.logger.debug(username)
    const createUserDto = new CreateUserDto()
    createUserDto.name = username
    const user = this.usersService.createUser(createUserDto)
    const payload = { id: user.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
