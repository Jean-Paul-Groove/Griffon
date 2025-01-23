import { Module } from '@nestjs/common'
import { GameGateway } from './game.gateway'
import { GameService } from './game.service'
import { CommonModule } from '../common/common.module'
import { RoomService } from '../common/room/room.service'
import { UsersService } from '../users/users.service'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [CommonModule, UsersModule],
  providers: [GameGateway, GameService, RoomService, UsersService],
})
export class GameModule {}
