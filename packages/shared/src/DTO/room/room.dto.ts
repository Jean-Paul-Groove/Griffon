import { PlayerInfoDto } from '../player/player.dto'
import { GameInfoDto, ScoreDto } from '../game/game.dto'
import { ChatMessageDto } from '../chat'

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


