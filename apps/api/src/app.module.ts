import { Module } from '@nestjs/common'
import { CommonModule } from './common/common.module'
import { AuthModule } from './auth/auth.module'
import { PlayerModule } from './player/player.module'
import { ConfigModule } from '@nestjs/config'
import { RoomModule } from './room/room.module'
import jwtConfig from './config/jwt.config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Player } from './player/entities/player.entity'
import { Room } from './room/entities/room.entity'
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
import { ThrottlerModule } from '@nestjs/throttler'
import { join } from 'path'
import { ServeStaticModule } from '@nestjs/serve-static'

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
      logging: false,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'start-game', ttl: 2000, limit: 1 },
        { name: 'short', ttl: 1000, limit: 2 },
        { name: 'medium', ttl: 10000, limit: 12 },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads', 'public'),
      serveRoot: '/uploads/public/',
      serveStaticOptions: {
        extensions: ['webp'],
      },
    }),
    ScheduleModule.forRoot(),
    GameModule,
    CommonModule,
    AuthModule,
    PlayerModule,
    RoomModule,
    ChatModule,
  ],
})
export class AppModule {}
