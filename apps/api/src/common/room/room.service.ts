import { Injectable, Logger } from '@nestjs/common'
import { Room } from './classes/Room'
import { RoomOptions } from './types/room/RoomOptions'
import { User } from '../../users/types/User'
import { Message } from '../message/types/Message'
import { v4 as uuidv4 } from 'uuid'
@Injectable()
export class RoomService {
  private readonly rooms: Map<string, Room> = new Map()
  private readonly logger = new Logger(RoomService.name, { timestamp: true })
  createRoom(id?: string, options?: RoomOptions): Room {
    try {
      const roomId = id ?? uuidv4()
      const room = new Room(roomId, options)
      this.rooms.set(id, room)
      return room
    } catch (error) {
      if (error) {
        this.logger.error(`An error occured while creating the room ${id}`, error)
      }
    }
  }
  deleteRoom(id: string): void {
    try {
      const isDeleted = this.rooms.delete(id)
      if (!isDeleted) {
        throw new Error(`Couldn't find room ${id}`)
      }
    } catch (error: unknown) {
      this.logger.error(`An error occured while deleting room ${id}`, error)
    }
  }
  getRoom(id: string): Room {
    try {
      const room = this.rooms.get(id)
      if (!room) {
        throw new Error(`Room not found`)
      }
      return room
    } catch (error: unknown) {
      this.logger.error(`An error occured while fetching room ${id}`, error)
    }
  }
  addUserToRoom(roomId: string, user: User): User {
    try {
      const room = this.getRoom(roomId)
      room.addUser(user)
      return user
    } catch (error) {
      this.logger.error(error)
    }
  }
  removeUserFromRoom(roomId: string, userId: string): void {
    try {
      const room = this.getRoom(roomId)
      room.removeUser(userId)
    } catch (error) {
      this.logger.error(error)
    }
  }
  addMessageToRoom(roomId: string, message: Message): Message {
    try {
      const room = this.getRoom(roomId)
      room.addMessage(message)
      return message
    } catch (error) {
      this.logger.error(error)
    }
  }
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId)
  }
}
