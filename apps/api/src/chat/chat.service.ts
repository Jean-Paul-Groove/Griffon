import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { RoomService } from '../room/room.service'
import { Server, Socket } from 'socket.io'
import { GameService } from '../game/game.service'
import { PlayerService } from '../player/player.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Chat } from './entities/chat.entity'
import { Repository } from 'typeorm'
import { ChatMessageDto, NewChatMessageDto, WSE } from 'shared'
import { CommonService } from '../common/common.service'

@Injectable()
export class ChatService {
  constructor(
    @Inject(forwardRef(() => RoomService))
    private roomService: RoomService,
    private playerService: PlayerService,
    @Inject(forwardRef(() => GameService))
    private gameService: GameService,
    private commonService: CommonService,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {
    this.io = this.commonService.io
  }
  public io: Server
  private readonly logger = new Logger(ChatService.name, { timestamp: true })

  async onNewChatMessage(message: string, client: Socket): Promise<void> {
    const player = await this.playerService.get(client.data.playerId)
    const room = await this.roomService.getRoomFromPlayer(player)
    // Check if current game takes guesses
    if (room.currentGame?.specs?.withGuesses) {
      const showMessage = await this.gameService.guessWord(message, player, room)
      // If player has good guess do not send the answer to the roomchat
      if (!showMessage) {
        return
      }
    }
    // Create and send chat message
    const chatEntity = this.chatRepository.create({ sender: player, content: message, room: room })
    const chat = await this.chatRepository.save(chatEntity, { reload: true })

    const data: NewChatMessageDto = {
      event: WSE.NEW_CHAT_MESSAGE,
      arguments: { chatMessage: this.generateChatMessageDto(chat) },
    }
    this.commonService.emitToRoom(room.id, data)
  }

  generateChatMessageDto(chat: Chat): ChatMessageDto {
    const { id, content, sentAt, sender } = chat
    return new ChatMessageDto({
      id,
      content,
      sentAt,
      sender: { id: sender.id, name: sender.name, role: sender.role, avatar: sender.avatar },
    })
  }
}
