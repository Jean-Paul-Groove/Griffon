import { forwardRef, Module } from '@nestjs/common'
import { PlayerService } from './player.service'
import { AuthModule } from '../auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'

@Module({
  imports: [forwardRef(() => AuthModule), TypeOrmModule.forFeature([Player])],
  providers: [PlayerService],
  exports: [PlayerService, TypeOrmModule],
})
export class PlayerModule {}
