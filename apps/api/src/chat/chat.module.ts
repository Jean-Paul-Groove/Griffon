import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Chat } from './entities/chat.entity'
import { ChatService } from './chat.service'
import { RoomModule } from '../room/room.module'
import { CommonModule } from '../common/common.module'
import { PlayerModule } from '../player/player.module'
import { GameModule } from '../game/game.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    forwardRef(() => RoomModule),
    CommonModule,
    PlayerModule,
    GameModule,
  ],
  providers: [ChatService],
  exports: [TypeOrmModule, ChatService],
})
export class ChatModule {}
