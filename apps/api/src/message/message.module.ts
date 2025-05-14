import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '../common/common.module'
import { PlayerModule } from '../player/player.module'
import { Message } from './entities/message.entity'
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => CommonModule),

    forwardRef(() => PlayerModule),

    AuthModule,
  ],
  providers: [MessageService],
  exports: [TypeOrmModule, MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
