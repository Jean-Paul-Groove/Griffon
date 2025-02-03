import { Module } from '@nestjs/common'
import { GameService } from './game.service'
import { AuthModule } from '../auth/auth.module'
import { GameGateway } from './game.gateway'
import { RoomModule } from '../room/room.module'

@Module({
  imports: [AuthModule, RoomModule],
  providers: [GameService, GameGateway],
})
export class GameModule {}
