import { Injectable, Logger } from '@nestjs/common'
import { Room } from './classes/Room'
import { RoomOptions } from './types/room/RoomOptions'
import { User } from '../user/types/User'
import { Message } from '../common/message/types/Message'
import { v4 as uuidv4 } from 'uuid'
import { Namespace, Server, Socket } from 'socket.io'
import { UserService } from '../user/user.service'
import { WsResponse } from '@nestjs/websockets'
import { WSE } from 'wse'
import { RoomInfoDto } from './dto/RoomInfoDto'

@Injectable()
export class RoomService {
  constructor(private userService: UserService) {}
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
  get(id: string): Room {
    return this.rooms.get(id)
  }
  private addUserToRoom(roomId: string, user: User): User {
    const room = this.get(roomId)
    room.addUser(user)
    return user
  }
  private removeUserFromRoom(roomId: string, userId: string): void {
    const room = this.get(roomId)
    room.removeUser(userId)
  }
  private addMessageToRoom(roomId: string, message: Message): Message {
    const room = this.get(roomId)
    room.addMessage(message)
    return message
  }
  private hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId)
  }
  private joinSocketToRoom(client: Socket, roomId: string): void {
    client.join(roomId)
    if (client.data.roomId !== roomId) {
      client.data.roomId = roomId
    }
  }
  // Handlers
  onUserJoinRoom(user: User, roomId: string, client: Socket): WsResponse<RoomInfoDto> {
    // Check if room exists
    const roomExists = this.hasRoom(roomId)
    // TO CHANGE
    if (!roomExists) {
      this.createRoom(roomId)
    }
    const room = this.get(roomId)
    const roomInfo = (): RoomInfoDto => ({
      id: room.id,
      users: room.getUsers(),
      messages: room.getMessages(),
      maxNumPlayer: room.maxNumPlayer,
    })
    // Check if user already has a room
    if (user.room) {
      // If it's the same room, treat as reconnexion
      if (user.room.id === roomId) {
        if (room.hasUser(user.id)) {
          this.joinSocketToRoom(client, room.id)
          user.room.connected = true
          this.io.to(room.id).emit(WSE.USER_RECONNECTED, { user })
          return { event: WSE.USER_JOINED_ROOM_SUCCESS, data: roomInfo() }
        }
      }
      if (user.room.id !== roomId) {
        this.removeUserFromRoom(user.room.id, user.id)
      }
    }
    this.addUserToRoom(roomId, user)
    user.room = { id: roomId, connected: true }

    this.joinSocketToRoom(client, roomId)

    const { id, name } = user

    this.io.to(roomId).emit(WSE.USER_JOINED_ROOM, { id, name })

    return { event: WSE.USER_JOINED_ROOM_SUCCESS, data: roomInfo() }
  }
  onDisconnectedClient(client: Socket): void {
    this.logger.log(`Cliend id:${client.data.userId} disconnected`)
    const user = this.userService.getUserFromSocket(client)
    if (user?.room) {
      const room = this.get(user.room.id)
      if (room) {
        const { id, name } = user
        this.io.to(room.id).emit(WSE.USER_DISCONNECTED, { id, name })
      }
      user.room.connected = false
    }
  }
  // Services
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
      return this.get(user.room.id)
    }
  }
}
