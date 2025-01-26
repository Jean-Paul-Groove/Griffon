import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { CommonModule } from '../common/common.module'
import { UsersModule } from '../users/users.module'
import { AuthModule } from '../auth/auth.module'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [CommonModule, UsersModule, AuthModule, JwtModule],
  providers: [GameService],
})
export class GameModule {}
