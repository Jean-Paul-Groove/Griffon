import { PlayerInfoDto } from '../player/player.dto'
import { RoomInfoDto } from '../room'

export class GameInfoDto {
  constructor(
    props: {
      id: string
      specs: SpecsDto
      room: RoomInfoDto['id']
      roundDuration: number | null
      onGoing: boolean,
      scores: ScoreDto[],
    }
  ) {
    Object.assign(this, props)
  }
  id: string
  specs: SpecsDto
  room: RoomInfoDto['id']
  roundDuration: number | null
  onGoing: boolean
}

export class SpecsDto {
  constructor(
    props: {
      id: string
      title: string
      description: string
      illustration: string | null
      rules: string | null
      withGuesses: boolean
      defaultRoundDuration: number
      pointStep: number
      pointsMax: number
    }
  ) {
    Object.assign(this, props)
  }
  id: string
  title: string
  description: string
  illustration: string | null
  rules: string | null
  withGuesses: boolean
  defaultRoundDuration: number
  pointStep: number
  pointsMax: number
}

export class ScoreDto {
  constructor(
    props: {
      points: number
      player: PlayerInfoDto['id']
    }
  ) {
    Object.assign(this, props)
  }
  points: number
  player: PlayerInfoDto['id']
}
