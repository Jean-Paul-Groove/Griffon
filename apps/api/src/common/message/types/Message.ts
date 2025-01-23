import { User } from 'src/users/types/User'

export interface Message {
  sender: User['id']
  content: string
  sent_at: number
}
