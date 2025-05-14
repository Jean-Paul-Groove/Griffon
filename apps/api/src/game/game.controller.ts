import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { GameService } from './game.service'
import { GameSpecs } from './entities/game.specs.entity'

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  getAvailableGames(): Promise<Partial<GameSpecs>[]> {
    return this.gameService.getAvailableGames()
  }
}
