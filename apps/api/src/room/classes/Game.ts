import { Logger } from '@nestjs/common'
import { Room } from './Room'
import { GameOptions } from '../types/room/GameOptions'
import { RoomService } from '../room.service'
import { WSE } from 'wse'
import { GameName, User } from 'dto'
export abstract class Game {
  constructor(room: Room, name: GameName, roomService: RoomService, options?: GameOptions) {
    this.room = room
    this.name = name
    this.logger = new Logger(name, { timestamp: true })
    this.roomService = roomService
    if (options?.maxRounds && Number.isInteger(options.maxRounds) && options.maxRounds > 0) {
      this.maxRounds = options.maxRounds
    }
  }
  room: Room
  roomService: RoomService
  logger: Logger
  name: GameName
  pendingFeedback = false
  canMakeGuess: boolean = false
  shareDrawing: boolean = false
  drawingTime: number = 30000
  drawingEndTime: number | null

  private hasStarted = false
  private currentRound = 1
  private maxRounds: number = 5

  abstract run(): void

  endofRound(): void {
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
    this.emitToRoom(WSE.START_GAME, this.name)
    this.runRound()
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
    this.emitToRoom(WSE.TIME_LIMIT, this.drawingEndTime)
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
