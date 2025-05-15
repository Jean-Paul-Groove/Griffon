import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { DetailedPlayerDto, PendingRequestDto, PlayerInfoDto } from 'shared'
import { MessageBody } from '@nestjs/websockets'
import { PlayerService } from './player.service'
import { AuthService } from '../auth/auth.service'
import { RegisteredGuard } from '../auth/guards/registered.guard'
import { AdminGuard } from '../auth/guards/admin.guard'
import { Player } from './entities/player.entity'
import { FileInterceptor, MemoryStorageFile, UploadedFile } from '@blazity/nest-file-fastify'
import { ImageValidationPipe } from '../common/pipes/imgValidator.pipe'
import { EditPlayerDto } from './validation/EditPlayer.dto'
import { AdminEditPlayerDto } from './validation/AdminEditPlayer.dto'
import { AdminCreatePlayerDto } from './validation/AdminCreatePlayer.dto'
@Controller('player')
export class PlayerController {
  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}

  // REGISTERED USER ROUTES
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
  // Registered Users can only modify their name, password or avatar
  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('edit')
  async editWithFile(
    @Body() body: EditPlayerDto,
    @Req() req: FastifyRequest,
    @UploadedFile(new ImageValidationPipe()) file: MemoryStorageFile,
  ): Promise<PlayerInfoDto> {
    const { name, password } = body
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req), true)
    if (!player) {
      throw new NotFoundException()
    }
    const editBody = { name, password, id: player.id }
    const editedPlayer = await this.playerService.editPlayer(editBody, file)
    return this.playerService.generatePlayerInfoDto(editedPlayer, [])
  }
  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Delete('self')
  async deleteSelf(@Req() req: FastifyRequest): Promise<void> {
    const playerId = this.authService.getPlayerIdFromRequest(req)
    return await this.playerService.deletePlayer(playerId)
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
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('admin/create')
  async adminCreateWithFile(
    @Body() body: AdminCreatePlayerDto,
    @UploadedFile(new ImageValidationPipe()) file: MemoryStorageFile,
  ): Promise<Player> {
    const { name, role, email, password } = body

    return await this.playerService.createPlayer({ name, role, email, password }, file)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @Patch('admin/edit')
  async adminEditWithFile(
    @Body() body: AdminEditPlayerDto,
    @UploadedFile(new ImageValidationPipe()) file: MemoryStorageFile,
  ): Promise<Player> {
    const { id, name, role, email, password } = body
    if (!id) {
      throw new BadRequestException()
    }
    const editBody = { id, name, role, email, password }
    return await this.playerService.editPlayer(editBody, file)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  async deletePlayer(@Query('id') playerId: string): Promise<void> {
    return await this.playerService.deletePlayer(playerId)
  }
}
