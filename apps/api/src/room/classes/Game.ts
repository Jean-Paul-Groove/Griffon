import { Logger } from '@nestjs/common'
import { Room } from './Room'
import { ScorePannel, ScoreMap } from '../types/room/Score'
import { GameOptions } from '../types/room/GameOptions'
import { RoomService } from '../room.service'
import { User } from '../../user/types/User'
import { WSE } from 'wse'
export abstract class Game {
  constructor(room: Room, name: string, roomService: RoomService, options?: GameOptions) {
    this.room = room
    this.name = name
    this.logger = new Logger(name, { timestamp: true })
    this.roomService = roomService
    if (options.maxRounds && Number.isInteger(options.maxRounds) && options.maxRounds > 0) {
      this.maxRounds = options.maxRounds
    }
    room.getUsers().forEach((user) => this.scores.set(user.id, 0))
  }
  room: Room
  roomService: RoomService
  logger: Logger
  name: string
  pendingFeedback = false
  scores: ScoreMap = new Map()
  canMakeGuess: boolean = false
  shareDrawing: boolean = false
  drawingTime: number = 30000
  drawingEndTime: number | null

  private globalScores: ScorePannel = {}
  private hasStarted = false
  private currentRound = 1
  private maxRounds: number = 5

  abstract run(): void

  endofRound(): void {
    const currentRoundScores = Array.from(this.scores.entries())
    this.globalScores[this.currentRound] = currentRoundScores
    this.room.updateGlobalScores(currentRoundScores)
    this.scores.clear()
    this.currentRound++
    this.runRound()
  }
  private runRound(): void {
    if (this.currentRound > this.maxRounds) {
      this.endGame()
      return
    }
    this.logger.debug(`START OF ROUND n°${this.currentRound}`)
    this.run()
  }
  private endGame(): void {
    this.room.endGame()
  }
  start(): void {
    this.logger.debug('START')

    if (this.hasStarted) {
      this.logger.warn('GAME ALREADY STARTED')
      return
    }
    this.hasStarted = true
    this.emitToRoom(WSE.START_GAME_GRIFFONARY)
    this.runRound()
  }
  getScores(): ScorePannel {
    return this.globalScores
  }
  emitToRoom(event: string, args?: unknown): void {
    this.roomService.io.in(this.room.id).emit(event, args)
  }
  emitToPlayer(event: string, player: User, args?: unknown): void {
    const client = this.roomService.getSocketFromUser(player.id)
    if (!client) {
      throw new Error(`Socket not found for ${player.name}`)
    }
    client.emit(event, args)
  }
  setDrawingTimeLimit(): void {
    this.drawingEndTime = Date.now() + this.drawingTime
  }
  getRemainingDrawingTime(): number {
    if (this.drawingEndTime) {
      const remainingTime = this.drawingEndTime - Date.now()
      if (remainingTime > 0) {
        return remainingTime
      }
    }
    return 0
  }
}
