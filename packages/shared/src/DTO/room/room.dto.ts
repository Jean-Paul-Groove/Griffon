import { PlayerInfoDto } from '../player/player.dto'
import { GameInfoDto, ScoreDto } from '../game/game.dto'

export class RoomInfoDto {
  constructor(
    props: {
      id: string,
      admin: PlayerInfoDto['id'],
      players: PlayerInfoDto[],
      limit: number,
      currentGame: GameInfoDto,
      scores: ScoreDto[],
      chatMessages: ChatMessageDto[]
    }
  ) {
    Object.assign(this, props)
  }
  id: string
  admin: PlayerInfoDto['id']
  players: PlayerInfoDto[]
  limit: number
  currentGame: GameInfoDto
  scores: ScoreDto[]
  chatMessages: ChatMessageDto[]
}


export class ChatMessageDto {
  constructor(
    props: {
      id: number
      content: string
      sender: PlayerInfoDto['id']
      room: RoomInfoDto['id']
      sentAt: Date
    }
  ) {
    Object.assign(this, props)
  }
  id: number
  content: string
  sender: PlayerInfoDto['id']
  room: RoomInfoDto['id']
  sentAt: Date
}