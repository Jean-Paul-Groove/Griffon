import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common'
import { GameService } from './game.service'
import { GameSpecs } from './entities/game.specs.entity'
import { Roles } from '../room/decorators/roles'
import { RoomGuard } from '../room/room.guard'
import { PlayerService } from '../player/player.service'
import { AuthService } from '../auth/auth.service'
import { AuthGuard } from '../auth/auth.guard'

@Controller('game')
export class GameController {
  constructor(
    private gameService: GameService,
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}
  private readonly logger = new Logger(GameController.name)

  @HttpCode(HttpStatus.OK)
  @Get()
  getAvailableGames(): Promise<Partial<GameSpecs>[]> {
    return this.gameService.getAvailableGames()
  }

  @UseGuards(AuthGuard)
  @UseGuards(RoomGuard)
  @Get('/start/:game')
  @Roles('admin')
  async startNewGame(@Param('game') gameName: string, @Req() request: any): Promise<void> {
    try {
      const playerId = this.authService.getPlayerIdFromRequest(request)
      const player = await this.playerService.get(playerId)
      await this.gameService.askStartGame(player, gameName)
    } catch {
      throw new BadRequestException()
    }
  }
}
