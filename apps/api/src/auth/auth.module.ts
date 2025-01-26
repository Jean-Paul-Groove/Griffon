import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { CommonModule } from '../common/common.module'
import { JwtModule } from '@nestjs/jwt'
import jwtConfig from '../config/jwt.config'

@Module({
  imports: [
    UsersModule,
    CommonModule,
    JwtModule.registerAsync({
      useFactory: jwtConfig,
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
