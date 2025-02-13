import { User } from 'src/user/types/User'

export interface Message {
  id: number
  sender: User
  content: string
  sent_at: number
}
