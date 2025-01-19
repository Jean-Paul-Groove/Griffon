import { User } from 'src/common/user/types/User'

export interface Message {
  sender: User['id']
  content: string
  sent_at: number
}
