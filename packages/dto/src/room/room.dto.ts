import { Player, User } from "../users/types"
import { GameName, Message } from "./types"

export class RoomInfoDto {
    id: string
    owner: string | null
    players: Player[]
    messages: Message[]
    maxNumPlayer: number
    currentGame:GameName |null
  }
export class NewMessageDto {
    sender: User
    content: string
    sent_at: number
}