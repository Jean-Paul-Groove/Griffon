import { UserInfoDto } from 'shared'

export interface Message {
  id: number
  sender: UserInfoDto
  content: string
  sent_at: number
}
