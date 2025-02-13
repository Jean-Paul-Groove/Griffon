import { User } from '../../../user/types/User'

export type ScoreMap = Map<User['id'], number>
export type Score = [userId: string, score: number]
export interface ScorePannel {
  [round: number]: Score[]
}
