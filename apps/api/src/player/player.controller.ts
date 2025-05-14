import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { DetailedPlayerDto, PendingRequestDto } from 'shared'
import { MessageBody } from '@nestjs/websockets'
import { PlayerService } from './player.service'
import { AuthService } from '../auth/auth.service'
import { RegisteredGuard } from '../auth/guards/registered.guard'
import { AdminGuard } from '../auth/guards/admin.guard'
import { Player } from './entities/player.entity'
import { FileInterceptor, MemoryStorageFile, UploadedFile } from '@blazity/nest-file-fastify'
import { ImageValidationPipe } from '../common/pipes/imgValidator.pipe'
@Controller('player')
export class PlayerController {
  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Get('friend-requests')
  async getPendingFriendRequests(@Req() req: FastifyRequest): Promise<PendingRequestDto[]> {
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req))

    return await this.playerService.getPendingRequest(player)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Post('accept-request')
  async acceptFriendRequest(
    @Req() req: FastifyRequest,
    @MessageBody('requestId') requestId: string,
  ): Promise<PendingRequestDto[]> {
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req), true)

    await this.playerService.acceptFriendRequest(player, requestId)
    return await this.playerService.getPendingRequest(player)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Post('reject-request')
  async rejectFriendRequest(
    @Req() req: FastifyRequest,
    @MessageBody('requestId') requestId: string,
  ): Promise<PendingRequestDto[]> {
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req), true)

    await this.playerService.refuseFriendRequest(player, requestId)
    return await this.playerService.getPendingRequest(player)
  }

  // ADMIN ROUTES

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Get('admin/list')
  async getPlayers(
    @Query('offset') offset: number,
    @Query('size') size: number,
  ): Promise<[DetailedPlayerDto[], count: number]> {
    return await this.playerService.getPlayers(offset, size)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Patch('admin/edit')
  async register(@Body() body: Player): Promise<Player> {
    const { id, name, role, email, password } = body
    if (!id) {
      throw new BadRequestException()
    }
    const editBody = { id, name, role, email, password }

    return this.playerService.editPlayer(editBody)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('admin/edit_f')
  async editWithFile(
    @Body() body: Player,
    @UploadedFile(new ImageValidationPipe()) file: MemoryStorageFile,
  ): Promise<Player> {
    const { id, name, role, email, password } = body
    if (!id) {
      throw new BadRequestException()
    }
    const editBody = { id, name, role, email, password }
    return this.playerService.editPlayer(editBody, file)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  async deletePlayer(@Query('id') playerId: string): Promise<void> {
    return this.playerService.deletePlayer(playerId)
  }
}
