import { Injectable, Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { PlayerService } from '../player/player.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
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
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {
    this.io = this.commonService.io
  }
  public io: Server
  private readonly logger = new Logger(MessageService.name, { timestamp: true })

  async onNewMessage(message: string, client: Socket, receiver: Player['id']): Promise<void> {
    const player = await this.playerService.getPlayerFromSocket(client)
    const receiverEntity = this.playerRepository.create({ id: receiver })
    // Create and send chat message
    const messageEntity = this.messageRepository.create({
      sender: player,
      content: message,
      receiver: receiverEntity,
      seen: false,
    })
    const newMessage = await this.messageRepository.save(messageEntity, { reload: true })

    const data: NewMessageDto = {
      event: WSE.NEW_PRIVATE_MESSAGE,
      arguments: { message: this.generateMessageDto(newMessage) },
    }
    this.commonService.emitToPlayer(receiver, data)
    this.commonService.emitToPlayer(player.id, data)
  }
  generateMessageDto(message: Message): MessageDto {
    console.log(message)
    const { id, content, sentAt, sender, receiver, seen } = message
    return new MessageDto({
      id,
      content,
      sentAt,
      sender: { id: sender.id, name: sender.name, role: sender.role, avatar: sender.avatar },
      receiver: {
        id: receiver.id,
        name: receiver.name,
        role: receiver.role,
        avatar: receiver.avatar,
      },
      seen,
    })
  }
  async getPlayerConversations(player: Player): Promise<MessageDto[]> {
    const messages = await this.messageRepository.query(
      `
  SELECT DISTINCT ON (
    LEAST("senderId", "receiverId"), 
    GREATEST("senderId", "receiverId")
  ) m.*,
   sender.id as sender_id,
   sender.name as sender_name,
   sender.avatar as sender_avatar,
   sender.role as sender_role,
    receiver.id as receiver_id,
   receiver.name as receiver_name,
   receiver.avatar as receiver_avatar,
   receiver.role as receiver_role
  FROM message m
  JOIN player sender on sender.id = m."senderId"
  JOIN player receiver on receiver.id = m."receiverId"
  WHERE "senderId" = $1 OR "receiverId" = $1
  ORDER BY 
    LEAST("senderId", "receiverId"), 
    GREATEST("senderId", "receiverId"), 
    "sentAt" DESC
`,
      [player.id],
    )
    return messages.map((conv) => {
      const {
        sender_id,
        sender_name,
        sender_avatar,
        sender_role,
        receiver_id,
        receiver_name,
        receiver_role,
        receiver_avatar,
      } = conv
      conv.sender = { id: sender_id, name: sender_name, avatar: sender_avatar, role: sender_role }
      conv.receiver = {
        id: receiver_id,
        name: receiver_name,
        role: receiver_role,
        avatar: receiver_avatar,
      }
      return this.generateMessageDto(conv)
    })
  }
  async getMessages(player: Player, friend: Player, offset: number = 0): Promise<MessageDto[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.receiver', 'receiver')
      .leftJoinAndSelect('messages.sender', 'sender')
      .where([
        { sender: player, receiver: friend },
        { sender: friend, receiver: player },
      ])
      .orderBy('messages.sentAt', 'DESC')
      .skip(offset)
      .take(50)
      .getMany()
    return messages.map((message) => this.generateMessageDto(message))
  }
}
