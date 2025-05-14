import { Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { PendingRequestDto } from 'shared'
import { MessageBody } from '@nestjs/websockets'
import { PlayerService } from './player.service'
import { AuthService } from '../auth/auth.service'
import { RegisteredGuard } from '../auth/guards/registered.guard'
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
}
