import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Get,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { Token } from './types/Token'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  private readonly logger = new Logger(AuthController.name)

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signInAsGuest(@Body() signInAsGuestDto: { username: string }): Promise<Token> {
    if (!signInAsGuestDto.username || typeof signInAsGuestDto.username !== 'string') {
      throw new BadRequestException()
    }
    return this.authService.signInAsGuest(signInAsGuestDto.username)
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(): string {
    return 'pong'
  }
}
