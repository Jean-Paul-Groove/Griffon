import { User } from 'src/user/types/User'
import { RoomOptions } from '../types/room/RoomOptions'
import { Message } from 'src/common/message/types/Message'
import { Logger } from '@nestjs/common'
export class Room {
  constructor(id: string, options?: RoomOptions) {
    this.id = id
    this.logger = new Logger(`Room-${this.id}`, { timestamp: true })
    if (options?.maxNumPlayer && Number.isInteger(options?.maxNumPlayer)) {
      this.maxNumPlayer = options.maxNumPlayer
    }
  }
  readonly id: string
  private readonly users: Map<string, User> = new Map()
  readonly maxNumPlayer: number = 8
  private readonly messages: Message[] = []
  private readonly logger
  getUsers(): User[] {
    return [...this.users.values()]
  }
  addUser(user: User): void {
    if (this.users.has(user.id)) {
      this.logger.warn(`User ${user.id} is already in the room ${this.id}`)
      return
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
  addMessage(message: Message): void {
    this.messages.push(message)
  }
  hasUser(id: string): boolean {
    return this.users.has(id)
  }
}
