// import { RoomOptions } from '../types/room/RoomOptions'
// import { Message } from 'src/common/message/types/Message'
// import { Logger } from '@nestjs/common'
// import { Game } from './Game'
// import { Griffonary } from './games/Griffonary'
// import { RoomService } from '../room.service'
// import { GameName, Player, User } from 'dto'
// export class Room {
//   constructor(id: string, options?: RoomOptions) {
//     this.id = id
//     this.logger = new Logger(`Room-${this.id}`, { timestamp: true })
//     if (options?.maxNumPlayer && Number.isInteger(options?.maxNumPlayer)) {
//       this.maxNumPlayer = options.maxNumPlayer
//     }
//     if (options?.owner) {
//       this.owner = options.owner.id
//       this.addPlayer(options.owner)
//     }
//   }
//   readonly id: string
//   private readonly players: Map<string, Player> = new Map()
//   readonly maxNumPlayer: number = 8
//   readonly owner: string | null = null
//   private readonly messages: Message[] = []
//   private readonly logger
//   private messageId = 0
//   private currentGame: Game | null = null

//   // PLAYERS
//   getPlayers(): Player[] {
//     return [...this.players.values()]
//   }
//   addPlayer(user: User): void {
//     if (this.players.has(user.id)) {
//       this.logger.warn(`User ${user.id} is already in the room ${this.id}`)
//       return
//     }
//     if (this.players.size >= this.maxNumPlayer) {
//       throw new Error(`Room is full with  ${this.maxNumPlayer} users`)
//     }
//     this.players.set(user.id, { ...user, points: 0, isDrawing: false })
//   }
//   getPlayer(id: string): Player {
//     const user = this.players.get(id)
//     if (!user) {
//       throw new Error(`User ${id} was not found in room ${this.id}`)
//     }
//     return user
//   }
//   removePlayer(id: string): void {
//     const isDeleted = this.players.delete(id)
//     if (!isDeleted) {
//       throw new Error(`User ${id} was not found`)
//     }
//   }
//   hasPlayer(id: string): boolean {
//     return this.players.has(id)
//   }

//   // MESSAGES
//   getMessages(): Message[] {
//     return [...this.messages]
//   }
//   addMessage(message: Omit<Message, 'id'>): void {
//     this.messages.push({ ...message, id: this.messageId })
//     this.messageId++
//   }

//   // GAME
//   setGame(name: GameName, roomService: RoomService): void {
//     switch (name) {
//       case 'Griffonary':
//         this.currentGame = new Griffonary(this, roomService)
//         break
//     }
//     this.logger.debug('GAME SET TO ' + name)
//   }
//   resetDrawingRights(): void {
//     this.getPlayers().forEach((user) => (user.isDrawing = false))
//   }
//   startGame(): void {
//     if (this.currentGame !== null) {
//       this.currentGame.start()
//     }
//   }
//   getGame(): GameName | null {
//     if (!this.currentGame) {
//       return null
//     }
//     return this.currentGame.name
//   }
//   endGame(): void {}
//   allowPlayerToDraw(userId: User['id']): void {
//     const player = this.getPlayer(userId)
//     player.isDrawing = true
//   }
//   canGuess(): boolean {
//     if (this.currentGame && this.currentGame.canMakeGuess) {
//       return true
//     }
//     return false
//   }
//   makeGuess(guess: string, userId: User['id']): void {
//     if (this.currentGame && this.currentGame instanceof Griffonary) {
//       const player = this.getPlayer(userId)
//       this.currentGame.guessWord(guess, player)
//     }
//   }
//   canPlayerDraw(user: User): boolean {
//     const player = this.getPlayer(user.id)
//     if (player.isDrawing && this.currentGame?.shareDrawing) {
//       return true
//     }
//     return false
//   }
//   getDrawingTimeLimit(): number {
//     if (this.currentGame) {
//       return this.currentGame.drawingEndTime
//     }
//     return 0
//   }
// }
