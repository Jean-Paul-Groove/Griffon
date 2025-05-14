import { forwardRef, Module } from '@nestjs/common'
import { PlayerService } from './player.service'
import { AuthModule } from '../auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'
import { CommonModule } from '../common/common.module'
import { FriendRequest } from './entities/friend.request.entity'
import { PlayerController } from './player.controller'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Player, FriendRequest]),
    forwardRef(() => CommonModule),
  ],
  providers: [PlayerService],
  exports: [PlayerService, TypeOrmModule],
  controllers: [PlayerController],
})
export class PlayerModule {}
