import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Token } from './types/Token'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signInAsGuest(@Body() signInAsGuestDto: Record<string, any>): Promise<Token> {
    console.log('TRIGGER')
    console.log(process.env.JWT_SECRET)
    return this.authService.signInAsGuest(signInAsGuestDto.username)
  }
}
