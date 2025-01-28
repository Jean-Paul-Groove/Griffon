import { Body, Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Token } from './types/Token'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  private readonly logger = new Logger(AuthController.name)

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signInAsGuest(@Body() signInAsGuestDto: Record<string, any>): Promise<Token> {
    try {
      this.logger.debug(signInAsGuestDto.username)
      if (!signInAsGuestDto.username) {
        //error
      }
      return this.authService.signInAsGuest(signInAsGuestDto.username)
    } catch (error) {
      this.logger.error(error)
    }
  }
}
