import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common'
import { PlayerService } from './player.service'
import { PlayerInfoDto } from 'shared'
import { RegisteredGuard } from '../auth/guards/registered.guard'
import { FastifyRequest } from 'fastify'
import { AuthService } from '../auth/auth.service'
@Controller('player')
export class PlayerController {
  constructor(
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('friends')
  @UseGuards(RegisteredGuard)
  async getFriendsInfo(@Req() request: FastifyRequest): Promise<PlayerInfoDto[]> {
    const player = await this.playerService.get(
      this.authService.getPlayerIdFromRequest(request),
      true,
    )
    console.log(player.friends)
    return this.playerService.getFriendsInfo(player.friends.map((friend) => friend.id))
  }
}
