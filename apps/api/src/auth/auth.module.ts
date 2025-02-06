import { forwardRef, Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserModule } from '../user/user.module'
import { CommonModule } from '../common/common.module'
import { JwtModule } from '@nestjs/jwt'
import jwtConfig from '../config/jwt.config'

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      useFactory: jwtConfig,
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
