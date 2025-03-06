import { Body, Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Token } from './types/Token'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  private readonly logger = new Logger(AuthController.name)

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signInAsGuest(@Body() signInAsGuestDto: Record<string, string>): Promise<Token> {
    this.logger.debug(signInAsGuestDto)
    if (!signInAsGuestDto.username || typeof signInAsGuestDto.username !== 'string') {
      throw new Error('Bad Request')
    }
    return this.authService.signInAsGuest(signInAsGuestDto.username)
  }
}
