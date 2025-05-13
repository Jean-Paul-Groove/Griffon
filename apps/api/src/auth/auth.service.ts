import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PlayerService } from '../player/player.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { CreateGuestDto, CreateUserDto, UserRole } from 'shared'
import { InvalidCredentialsWsException } from '../common/ws/exceptions/invalidCredentials'
import { RegisterDto } from './validation/Register.dto'
import { Token } from './types/Token'
import * as bcrypt from 'bcrypt'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { LoginDto } from './validation/Login.dto'
import { FastifyRequest } from 'fastify'
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
  getPlayerIdFromRequest(request: FastifyRequest): string {
    const payload = this.jwtService.verify(request.headers?.authorization.split('bearer ')[1], {
      secret: process.env.JWT_SECRET,
    })
    if (payload.id.trim() !== '') {
      return payload.id
    }
  }
  async signUpAsGuest(name: string): Promise<Token> {
    const guest: CreateGuestDto = { name: name, role: UserRole.GUEST }
    const player = await this.playerService.createGuest(guest)
    const payload = { id: player.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async registerUser(userInfo: RegisterDto, avatar?: MemoryStorageFile): Promise<void> {
    const { username, email, password: toBeHashed } = userInfo
    const password = await bcrypt.hash(toBeHashed, 14)
    const createUserDto: CreateUserDto = {
      name: username,
      email,
      password,
      role: UserRole.REGISTERED_USER,
    }
    await this.playerService.createPlayer(createUserDto, avatar)
  }

  async login(loginDto: LoginDto): Promise<Token> {
    const player = await this.playerService.getPlayerCredentials(loginDto.email)
    if (!player) {
      throw new UnauthorizedException()
    }
    const validPassword = await bcrypt.compare(loginDto.password, player.password)
    if (!validPassword) {
      throw new UnauthorizedException()
    }
    const payload: any = { id: player.id }

    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}
