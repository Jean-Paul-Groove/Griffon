import { User } from 'src/user/types/User'
import { RoomOptions } from '../types/room/RoomOptions'
import { Message } from 'src/common/message/types/Message'
import { Logger } from '@nestjs/common'
import { Game } from './Game'
import { Score, ScoreMap } from '../types/room/Score'
import { Griffonary } from './games/Griffonary'
import { RoomService } from '../room.service'
export class Room {
  constructor(id: string, options?: RoomOptions) {
    this.id = id
    this.logger = new Logger(`Room-${this.id}`, { timestamp: true })
    if (options?.maxNumPlayer && Number.isInteger(options?.maxNumPlayer)) {
      this.maxNumPlayer = options.maxNumPlayer
    }
    if (options?.owner) {
      this.owner = options.owner.id
      this.addUser(options.owner)
    }
  }
  readonly id: string
  private readonly users: Map<string, User> = new Map()
  readonly maxNumPlayer: number = 8
  readonly owner: string | null = null
  private readonly messages: Message[] = []
  private readonly logger
  private messageId = 0
  private currentGame: Game | null = null
  private totalScores: ScoreMap = new Map()

  getUsers(): User[] {
    return [...this.users.values()]
  }
  addUser(user: User): void {
    if (this.users.has(user.id)) {
      this.logger.warn(`User ${user.id} is already in the room ${this.id}`)
      return
    }
    if (this.users.size >= this.maxNumPlayer) {
      throw new Error(`Room is full with  ${this.maxNumPlayer} users`)
    }
    this.users.set(user.id, user)
  }
  getUser(id: string): User {
    const user = this.users.get(id)
    if (!user) {
      throw new Error(`User ${id} was not found in room ${this.id}`)
    }
    return user
  }
  removeUser(id: string): void {
    const isDeleted = this.users.delete(id)
    if (!isDeleted) {
      throw new Error(`User ${id} was not found`)
    }
  }
  getMessages(): Message[] {
    return [...this.messages]
  }
  addMessage(message: Omit<Message, 'id'>): void {
    this.messages.push({ ...message, id: this.messageId })
    this.messageId++
  }
  hasUser(id: string): boolean {
    return this.users.has(id)
  }
  updateGlobalScores(gameScores: Score[]): void {
    for (const score of gameScores) {
      this.totalScores.set(score[0], (this.totalScores.get(score[0]) ?? 0) + score[1])
    }
  }
  allowuserToDraw(userId: User['id']): void {
    const user = this.getUser(userId)
    user.room.isDrawing = true
  }
  resetDrawingRights(): void {
    this.getUsers().forEach((user) => (user.room.isDrawing = false))
  }
  startGame(): void {
    if (this.currentGame !== null) {
      this.currentGame.start()
    }
  }
  endGame(): void {}
  canGuess(): boolean {
    if (this.currentGame && this.currentGame.canMakeGuess) {
      return true
    }
    return false
  }
  makeGuess(guess: string, user: User): void {
    if (this.currentGame && this.currentGame instanceof Griffonary) {
      this.currentGame.guessWord(guess, user)
    }
  }
  setGame(name: 'Griffonary', roomService: RoomService): void {
    switch (name) {
      case 'Griffonary':
        this.currentGame = new Griffonary(this, roomService)
        break
    }
  }
  canUserDraw(user: User): boolean {
    if (user.room.isDrawing && this.currentGame?.shareDrawing) {
      return true
    }
    return false
  }
  getRemainingDrawingTime(): number {
    if (this.currentGame) {
      return this.currentGame.getRemainingDrawingTime()
    }
    return 0
  }
}
