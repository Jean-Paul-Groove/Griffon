import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { PlayerService } from '../player/player.service'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import {
  CreateGuestDto,
  CreateUserDto,
  emailPattern,
  strongPasswordPattern,
  UserRole,
} from 'shared'
import { InvalidCredentialsWsException } from '../common/ws/exceptions/invalidCredentials'
import { RegisterDto } from './validation/Register.dto'
import { Token } from './types/Token'
import * as bcrypt from 'bcrypt'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { LoginDto } from './validation/Login.dto'
import { FastifyRequest } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { UnauthorizedWsException } from '../common/ws/exceptions/unauthorized'
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => PlayerService))
    private playerService: PlayerService,
    private jwtService: JwtService,
  ) {}
  private readonly logger = new Logger(AuthService.name)
  validateWsConnexion(client: Socket): boolean {
    const cookies = fastifyCookie.parse(client.handshake.headers.cookie || '')

    if (!cookies.token) {
      throw new UnauthorizedWsException()
    }
    const payload = this.jwtService.verify(cookies.token, {
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
    const cookies = fastifyCookie.parse(request.headers.cookie || '')

    if (!cookies.token) {
      throw new UnauthorizedWsException()
    }
    const payload = this.jwtService.verify(cookies.token, {
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

  async registerUser(userInfo: RegisterDto, avatar?: MemoryStorageFile): Promise<Token> {
    const { username, email, password: toBeHashed } = userInfo
    if (!this.checkEmailValidity(email)) {
      throw new BadRequestException('Incorrect email')
    }
    if (!this.checkPasswordStrength(toBeHashed)) {
      throw new BadRequestException('Weak password')
    }
    if (username.trim() === '') {
      throw new BadRequestException('Username can not be empty')
    }
    const password = await this.hashPassword(toBeHashed)
    const createUserDto: CreateUserDto = {
      name: username,
      email,
      password,
      role: UserRole.REGISTERED_USER,
    }
    const player = await this.playerService.createPlayer(createUserDto, avatar)

    const payload = { id: player.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
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
    const payload = { id: player.id }

    return {
      access_token: this.jwtService.sign(payload),
    }
  }
  async hashPassword(toBeHashed: string): Promise<string> {
    return await bcrypt.hash(toBeHashed, 14)
  }
  checkEmailValidity(email: string): boolean {
    return emailPattern.test(email)
  }
  checkPasswordStrength(password: string): boolean {
    return strongPasswordPattern.test(password)
  }
}
