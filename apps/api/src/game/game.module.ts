import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { AuthModule } from '../auth/auth.module'
import { GameGateway } from './game.gateway'
import { RoomModule } from '../room/room.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [AuthModule, RoomModule, UserModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
