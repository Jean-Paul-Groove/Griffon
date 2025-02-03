import { Injectable, Logger } from '@nestjs/common'
import { Room } from './classes/Room'
import { RoomOptions } from './types/room/RoomOptions'
import { User } from '../users/types/User'
import { Message } from '../common/message/types/Message'
import { v4 as uuidv4 } from 'uuid'
import { Namespace, Server, Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { UsersService } from '../users/users.service'
import { WsResponse } from '@nestjs/websockets'
import { WSE } from 'wse'

@Injectable()
export class RoomService {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}
  public io: Server | Namespace
  private readonly logger = new Logger(RoomService.name, { timestamp: true })
  private readonly rooms: Map<string, Room> = new Map()

  // Private methods
  private createRoom(id?: string, options?: RoomOptions): Room {
    const roomId = id ?? uuidv4()
    const room = new Room(roomId, options)
    this.rooms.set(id, room)
    return room
  }
  private deleteRoom(id: string): void {
    const isDeleted = this.rooms.delete(id)
    if (!isDeleted) {
      throw new Error(`Couldn't find room ${id}`)
    }
  }
  private getRoom(id: string): Room {
    return this.rooms.get(id)
  }
  private addUserToRoom(roomId: string, user: User): User {
    const room = this.getRoom(roomId)
    room.addUser(user)
    return user
  }
  private removeUserFromRoom(roomId: string, userId: string): void {
    const room = this.getRoom(roomId)
    room.removeUser(userId)
  }
  private addMessageToRoom(roomId: string, message: Message): Message {
    const room = this.getRoom(roomId)
    room.addMessage(message)
    return message
  }
  private hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId)
  }
  private joinSocketToRoom(client: Socket, roomId: string): void {
    client.join(roomId)
    client.data.roomId = roomId
  }
  // Handlers
  onUserJoinRoom(user: User, roomId: string, client: Socket): WsResponse<string[]> {
    try {
      const roomExists = this.hasRoom(roomId)
      // TO CHANGE
      if (!roomExists) {
        this.createRoom(roomId)
      }

      this.addUserToRoom(roomId, user)
      user.room = { roomId, connected: true }

      this.joinSocketToRoom(client, roomId)

      const { id, name } = user

      this.io.to(roomId).emit(WSE.USER_JOINED_ROOM, { id, name })

      return { event: WSE.USER_JOINED_ROOM_SUCCESS, data: undefined }
    } catch (error) {
      this.logger.error(error)
    }
  }
  onDisconnectedClient(client: Socket): void {
    try {
      this.logger.log(`Cliend id:${client.data.userId} disconnected`)
      const user = this.authService.getUserFromSocket(client)
      if (user?.room) {
        const room = this.getRoom(user.room.roomId)
        if (room) {
          const { id, name } = user
          this.io.to(room.id).emit(WSE.USER_DISCONNECTED, { id, name })
        }
        user.room.connected = false
      }
    } catch (error) {
      if (error) {
        this.logger.error(error)
      }
    }
  }
  // Services
  reconnectUser(user: User, client: Socket): void {
    try {
      if (user.room) {
        const room = this.getRoom(user.room.roomId)
        if (room.hasUser(user.id)) {
          this.logger.debug('ROOM HAS USER')
          this.joinSocketToRoom(client, room.id)

          user.room.connected = true
          const { id, name } = user
          this.logger.debug(room.id)
          this.io.to(room.id).emit(WSE.USER_RECONNECTED, { id, name })
        }
      }
    } catch (error) {
      this.logger.error(error)
    }
  }
  getSocketFromUser(userId: string): Socket | undefined {
    let sockets
    if (this.io instanceof Server) {
      sockets = this.io.sockets.sockets
    } else {
      sockets = this.io.sockets
    }
    return (Array.from(sockets.values()) as Socket[]).find(
      (socket) => socket.data.userId === userId,
    )
  }
  getRoomFromUser(user: User): Room | undefined {
    if (user.room) {
      return this.getRoom(user.room.roomId)
    }
  }
}
