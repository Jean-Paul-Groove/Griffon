import { PlayerInfoDto } from '../player'

export class ChatMessageDto {
  constructor(props: {
    id: string
    content: string
    sender: {
      id: PlayerInfoDto['id']
      name: PlayerInfoDto['name']
      role: PlayerInfoDto['role']
      avatar?: PlayerInfoDto['avatar']
    }
    sentAt: Date
  }) {
    Object.assign(this, props)
  }
  id: string
  content: string
  sender: {
    id: PlayerInfoDto['id']
    name: PlayerInfoDto['name']
    role: PlayerInfoDto['role']
    avatar?: PlayerInfoDto['avatar']
  }
  sentAt: Date
}
