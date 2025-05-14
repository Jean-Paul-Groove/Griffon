import { Controller, Get, HttpCode, HttpStatus, Param, Query, Req, UseGuards } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { MessageDto } from 'shared'
import { AuthService } from '../auth/auth.service'
import { RegisteredGuard } from '../auth/guards/registered.guard'
import { MessageService } from './message.service'
import { PlayerService } from '../player/player.service'
@Controller('message')
export class MessageController {
  constructor(
    private messageService: MessageService,
    private playerService: PlayerService,
    private authService: AuthService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Get('conversations')
  async getConversations(@Req() req: FastifyRequest): Promise<MessageDto[]> {
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req))

    return await this.messageService.getPlayerConversations(player)
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(RegisteredGuard)
  @Get('list/:contact')
  async acceptFriendRequest(
    @Req() req: FastifyRequest,
    @Param('contact') contact: string,
    @Query('offset') offset: number,
  ): Promise<MessageDto[]> {
    const player = await this.playerService.get(this.authService.getPlayerIdFromRequest(req), true)
    const friend = player.friends.find((fr) => fr.id === contact)
    if (!friend) {
      throw new Error('This contact is not one of your friends')
    }
    return await this.messageService.getMessages(player, friend, offset)
  }
}
