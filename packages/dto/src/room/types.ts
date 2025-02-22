import { User } from "../users/types"


export interface Message {
  id: number
  sender: User
  content: string
  sent_at: number
}

export type GameName = 'Griffonary'