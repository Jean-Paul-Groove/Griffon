import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { ConfigModule } from '@nestjs/config'
import { RoomModule } from './room/room.module'
import jwtConfig from './config/jwt.config'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    CommonModule,
    AuthModule,
    UserModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
