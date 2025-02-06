import { User } from 'src/user/types/User'

export interface Message {
  sender: User
  content: string
  sent_at: number
}
