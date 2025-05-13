import { Injectable, Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { PlayerService } from '../player/player.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MessageDto, NewMessageDto, WSE } from 'shared'
import { CommonService } from '../common/common.service'
import { Message } from './entities/message.entity'
import { Player } from '../player/entities/player.entity'

@Injectable()
export class MessageService {
  constructor(
    private playerService: PlayerService,
    private commonService: CommonService,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {
    this.io = this.commonService.io
  }
  public io: Server
  private readonly logger = new Logger(MessageService.name, { timestamp: true })

  async onNewMessage(message: string, client: Socket, receiver: Player['id']): Promise<void> {
    const player = await this.playerService.get(client.data.playerId)
    // Create and send chat message
    const messageEntity = this.messageRepository.create({
      sender: player,
      content: message,
      seen: false,
    })
    const newMessage = await this.messageRepository.save(messageEntity, { reload: true })

    const data: NewMessageDto = {
      event: WSE.NEW_PRIVATE_MESSAGE,
      arguments: { message: this.generateMessageDto(newMessage) },
    }
    this.commonService.emitToPlayer(receiver, data)
  }

  generateMessageDto(message: Message): MessageDto {
    const { id, content, sentAt, sender, receiver, seen } = message
    return new MessageDto({
      id,
      content,
      sentAt,
      sender: sender.id,
      receiver: receiver.id,
      seen,
    })
  }
}
