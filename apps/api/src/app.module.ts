import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { PlayerModule } from './player/player.module'
import { ConfigModule } from '@nestjs/config'
import { RoomModule } from './room/room.module'
import jwtConfig from './config/jwt.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Player } from './player/entities/player.entity'
import { Room } from './room/entities/room.entity'
import { GameService } from './game/game.service'
import { MessageService } from './message/message.service'
import { Message } from './message/entities/message.entity'
import { GameSpecs } from './game/entities/game.specs.entity'
import { Score } from './game/entities/score.entity'
import { Word } from './game/entities/word.entity'
import { Game } from './game/entities/game.entity'
import { Round } from './game/entities/round.entity'
import { GameModule } from './game/game.module'
import { ScheduleModule } from '@nestjs/schedule'
import { ChatModule } from './chat/chat.module'
import { Chat } from './chat/entities/chat.entity'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig], envFilePath: '.env' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      password: process.env.DB_PASSWORD,
      username: process.env.DB_USER,
      entities: [Player, Room, Chat, Message, GameSpecs, Game, Round, Score, Word],
      database: process.env.DB_NAME ?? 'griffon',
      synchronize: true,
      logging: true,
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    PlayerModule,
    RoomModule,
    GameModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService, GameService, MessageService],
})
export class AppModule {}
