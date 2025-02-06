import { Message } from '../../common/message/types/Message'
import { User } from '../../user/types/User'

export class RoomInfoDto {
  id: string
  users: User[]
  messages: Message[]
  maxNumPlayer: number
}
