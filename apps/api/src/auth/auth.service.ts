import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
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
import { RegisterDto } from './validation/Register.dto'
import { Token } from './types/Token'
import * as bcrypt from 'bcrypt'
import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { LoginDto } from './validation/Login.dto'
import { FastifyRequest } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import { UnauthorizedWsException } from '../common/ws/exceptions/unauthorized'
import { CommonService } from '../common/common.service'
import { ConcurrentConnectionsWsException } from '../common/ws/exceptions/concurrentConnection'
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => PlayerService))
    private playerService: PlayerService,
    private commonService: CommonService,
    private jwtService: JwtService,
  ) {}

  /**
   * Check that a client socket carries a valid cookie with a JWT
   * If so, add the PlayerId to the data of the socket for later requests.
   * @param {Socket} client The client socket to check
   * @returns {boolean}
   */
  validateWsConnexion(client: Socket): boolean {
    const cookies = fastifyCookie.parse(client.handshake.headers.cookie || '')

    if (!cookies.token) {
      throw new UnauthorizedWsException()
    }
    const payload = this.jwtService.verify(cookies.token, {
      secret: process.env.JWT_SECRET,
    })
    if (payload.id.trim() !== '') {
      // Check if the player is already connected with a socket
      const concurrentSocket = this.commonService.getSocketFromPlayer(payload.id)
      if (concurrentSocket && concurrentSocket.id != client.id) {
        throw new ConcurrentConnectionsWsException()
      }
      client.data.playerId = payload.id
    } else {
      throw new UnauthorizedWsException()
    }
    return true
  }

  /**
   * Retrieve the Id of a player from the cookie of an HTTP request
   * @param {FastifyRequest} request The request
   * @returns {string} The Id of the player
   */
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

  /**
   * Handle connection of a guest
   * @param {string} name The name of the player
   * @returns {Promise<Token>} Returns a token to be sent with cookies
   */
  async signUpAsGuest(name: string): Promise<Token> {
    const guest: CreateGuestDto = { name: name, role: UserRole.GUEST }
    const player = await this.playerService.createGuest(guest)
    const payload = { id: player.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  /**
   * Handle the subscription of a player
   * @param {RegisterDto} playerInfo The info necessary for the creation of the player
   * @param {MemoryStorageFile} avatar? The image file for the avatar of the player
   * @returns {Promise<Token>} Returns a token to be sent with cookies
   */
  async registerUser(playerInfo: RegisterDto, avatar?: MemoryStorageFile): Promise<Token> {
    const { username, email, password: toBeHashed } = playerInfo
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

  /**
   * Handle the connexion of a player
   * @param {LoginDto} loginDto The credentials of the player
   * @returns {Promise<Token>} Returns a token to be sent with cookies
   */
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

  /**
   * Hash a password with bcrypt
   * @param {string} toBeHashed:The password to be hashed
   * @returns { Promise<string>} Returns the hash
   */
  async hashPassword(toBeHashed: string): Promise<string> {
    return await bcrypt.hash(toBeHashed, 14)
  }

  /**
   * Check if the provided email is valid
   * @param {string} email The email to test
   * @returns {boolean}
   */
  checkEmailValidity(email: string): boolean {
    return emailPattern.test(email)
  }

  /**
   * Check if the provided password is strong enough
   * @param {string} password The password to test
   * @returns {boolean}
   */
  checkPasswordStrength(password: string): boolean {
    return strongPasswordPattern.test(password)
  }
}
