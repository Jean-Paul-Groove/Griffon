import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  Res,
} from '@nestjs/common'
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
  private readonly logger = new Logger(AuthController.name)

  @HttpCode(HttpStatus.OK)
  @Post('guest')
  signUpAsGuest(@Body() signInAsGuestDto: SignInAsGuestDto): Promise<Token> {
    return this.authService.signUpAsGuest(signInAsGuestDto.username)
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    return this.authService.registerUser(registerDto)
  }

  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('register_f')
  async registerWithAvatar(
    @Body() registerDto: RegisterDto,
    @UploadedFile(new ImageValidationPipe()) file?: MemoryStorageFile,
  ): Promise<void> {
    return await this.authService.registerUser(registerDto, file)
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<Token> {
    const token = await this.authService.login(loginDto)
    response.setCookie('jwt', token.access_token)
    return token
  }
}
