import { Module } from '@nestjs/common'
import { ChatGateway } from './chat.gateway'
import { ChatService } from './chat.service'
import { AuthModule } from '../auth/auth.module'
import { RoomModule } from '../room/room.module'
import { UserModule } from '../user/user.module'

@Module({
  imports: [AuthModule, RoomModule, UserModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
