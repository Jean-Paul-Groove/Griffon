import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Token } from './types/Token'
import { SignInAsGuestDto } from './validation/SignInAsGuest.dto'
import { RegisterDto } from './validation/Register.dto'
import { FileInterceptor, MemoryStorageFile, UploadedFile } from '@blazity/nest-file-fastify'
import { ImageValidationPipe } from '../common/pipes/imgValidator.pipe'
import { LoginDto } from './validation/Login.dto'
import { FastifyReply } from 'fastify'
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signUpAsGuest(@Body() signInAsGuestDto: SignInAsGuestDto): Promise<Token> {
    return this.authService.signUpAsGuest(signInAsGuestDto.username)
  }

  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('register')
  async registerWithAvatar(
    @Body() registerDto: RegisterDto,
    @UploadedFile(new ImageValidationPipe()) file?: MemoryStorageFile,
  ): Promise<Token> {
    return await this.authService.registerUser(registerDto, file)
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<Token> {
    const token = await this.authService.login(loginDto)
    res.cookie('token', token.access_token, {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'prod',
      maxAge: 60 * 24,
    })
    console.log(token)
    return token
  }
}
