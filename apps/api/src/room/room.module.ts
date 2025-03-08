import { forwardRef, Module } from '@nestjs/common'
import { RoomService } from './room.service'
import { RoomGateway } from './room.gateway'
import { AuthModule } from '../auth/auth.module'
import { PlayerModule } from '../player/player.module'
import { CommonModule } from '../common/common.module'
import { Room } from './entities/room.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GameModule } from '../game/game.module'
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [
    AuthModule,
    CommonModule,
    PlayerModule,
    forwardRef(() => GameModule),
    forwardRef(() => ChatModule),
    TypeOrmModule.forFeature([Room]),
  ],
  providers: [RoomService, RoomGateway],
  exports: [RoomService, TypeOrmModule],
})
export class RoomModule {}
