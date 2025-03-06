import { forwardRef, Module } from '@nestjs/common'
import { GameService } from './game.service'
import { RoomModule } from '../room/room.module'
import { CommonModule } from '../common/common.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Game } from './entities/game.entity'
import { GameSpecs } from './entities/game.specs.entity'
import { Round } from './entities/round.entity'
import { PlayerModule } from '../player/player.module'
import { GriffonaryService } from './griffonary.service'
import { Word } from './entities/word.entity'
import { Score } from './entities/score.entity'

@Module({
  providers: [GameService, GriffonaryService],
  imports: [
    forwardRef(() => RoomModule),
    CommonModule,
    PlayerModule,
    TypeOrmModule.forFeature([Game, GameSpecs, Round, Word, Score]),
  ],
  exports: [GameService, GriffonaryService, TypeOrmModule],
})
export class GameModule {}
