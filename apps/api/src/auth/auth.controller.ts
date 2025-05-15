import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Res,
  Delete,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInAsGuestDto } from './validation/SignInAsGuest.dto'
import { RegisterDto } from './validation/Register.dto'
import { FileInterceptor, MemoryStorageFile, UploadedFile } from '@blazity/nest-file-fastify'
import { ImageValidationPipe } from '../common/pipes/imgValidator.pipe'
import { LoginDto } from './validation/Login.dto'
import { FastifyReply } from 'fastify'
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  private cookie = {
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.ENVIRONMENT === 'prod',
    maxAge: 60 * 24 * 1000,
    path: '/',
  }
  @HttpCode(HttpStatus.OK)
  @Post('guest')
  async signUpAsGuest(
    @Body() signInAsGuestDto: SignInAsGuestDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<boolean> {
    const token = await this.authService.signUpAsGuest(signInAsGuestDto.username)

    res.cookie('token', token.access_token, {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'prod',
      maxAge: 60 * 24 * 1000,
      path: '/',
    })
    return true
  }

  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('register')
  async registerWithAvatar(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: FastifyReply,
    @UploadedFile(new ImageValidationPipe()) file?: MemoryStorageFile,
  ): Promise<boolean> {
    const token = await this.authService.registerUser(registerDto, file)
    res.cookie('token', token.access_token, {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'prod',
      maxAge: 60 * 24 * 1000,
      path: '/',
    })
    return true
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<boolean> {
    const token = await this.authService.login(loginDto)
    res.cookie('token', token.access_token, {
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'prod',
      maxAge: 60 * 24 * 1000,
      path: '/',
    })
    return true
  }

  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  logout(@Res({ passthrough: true }) res: FastifyReply): boolean {
    res.clearCookie('token')
    return true
  }
}
