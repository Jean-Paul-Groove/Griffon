import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '../common/common.module'
import { PlayerModule } from '../player/player.module'
import { GameModule } from '../game/game.module'
import { Message } from './entities/message.entity'
import { MessageService } from './message.service'

@Module({
  imports: [TypeOrmModule.forFeature([Message]), CommonModule, PlayerModule, GameModule],
  providers: [MessageService],
  exports: [TypeOrmModule, MessageService],
})
export class MessageModule {}
