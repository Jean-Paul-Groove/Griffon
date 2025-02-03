import { Module } from '@nestjs/common'
import { RoomService } from './room.service'
import { RoomGateway } from './room.gateway'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'

@Module({
  providers: [RoomService, RoomGateway],
  imports: [AuthModule, UsersModule],
  exports: [RoomService],
})
export class RoomModule {}
