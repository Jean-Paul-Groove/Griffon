import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { GameService } from './game.service'
import { GameSpecs } from './entities/game.specs.entity'
import { AdminGuard } from '../auth/guards/admin.guard'
import { AdminEditGameSpecsDto } from './validations/AdminEditGameSpecsDto'
import { FileInterceptor, MemoryStorageFile, UploadedFile } from '@blazity/nest-file-fastify'
import { ImageValidationPipe } from '../common/pipes/imgValidator.pipe'

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  async getAvailableGames(): Promise<Partial<GameSpecs>[]> {
    const specs = await this.gameService.getAvailableGames()
    return specs
  }
  // ADMIN ROUTES
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Get('admin/list')
  async getDetailedGames(): Promise<Partial<GameSpecs>[]> {
    const specs = await this.gameService.getAvailableGames(true)
    return specs
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('illustration'))
  @Patch('admin/edit')
  async editGameSpecs(
    @Body() body: AdminEditGameSpecsDto,
    @UploadedFile(new ImageValidationPipe()) file: MemoryStorageFile,
  ): Promise<Partial<GameSpecs>> {
    const specs = await this.gameService.editGameSpecs(body, file)
    return specs
  }
}
