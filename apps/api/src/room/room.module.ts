import { Module } from '@nestjs/common'
import { RoomService } from './room.service'
import { RoomGateway } from './room.gateway'
import { AuthModule } from '../auth/auth.module'
import { UserModule } from '../user/user.module'
import { CommonModule } from '../common/common.module'

@Module({
  providers: [RoomService, RoomGateway],
  imports: [AuthModule, UserModule, CommonModule],
  exports: [RoomService],
})
export class RoomModule {}
