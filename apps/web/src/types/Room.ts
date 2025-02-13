import type { User } from './User'

export interface Room {
  id: string
  maxNumPlayer: number
  users: User[]
  messages: Message[]
}

export interface Message {
  index: number
  content: string
  sent_at: number
  sender: User
}
