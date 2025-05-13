import { forwardRef, Module } from '@nestjs/common'
import { PlayerService } from './player.service'
import { AuthModule } from '../auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Player } from './entities/player.entity'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Player]),
    forwardRef(() => CommonModule),
  ],
  providers: [PlayerService],
  exports: [PlayerService, TypeOrmModule],
})
export class PlayerModule {}
