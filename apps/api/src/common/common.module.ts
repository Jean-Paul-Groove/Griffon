import { forwardRef, Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WsFilter } from './ws/ws.filter'
import { CommonService } from './common.service'
import { CommonGateway } from './common.gateway'
import { GameModule } from '../game/game.module'
import { ChatModule } from '../chat/chat.module'
import { AuthModule } from '../auth/auth.module'
import { RoomModule } from '../room/room.module'
import { PlayerModule } from '../player/player.module'
import { MessageModule } from '../message/message.module'

@Module({
  exports: [WsFilter, CommonService],
  providers: [WsFilter, CommonService, CommonGateway],
  imports: [
    HttpModule,
    forwardRef(() => AuthModule),
    forwardRef(() => PlayerModule),
    forwardRef(() => GameModule),
    forwardRef(() => ChatModule),
    forwardRef(() => RoomModule),
    forwardRef(() => MessageModule),
  ],
})
export class CommonModule {}
