import { Injectable, Logger } from '@nestjs/common'
import { Room } from './classes/Room'
import { RoomOptions } from './types/room/RoomOptions'
import { Message } from '../common/message/types/Message'
import { v4 as uuidv4 } from 'uuid'
import { Namespace, Server, Socket } from 'socket.io'
import { UserService } from '../user/user.service'
import { WsException, WsResponse } from '@nestjs/websockets'
import { WSE } from 'wse'
import { GameName, RoomInfoDto, User } from 'dto'

@Injectable()
export class RoomService {
  constructor(private userService: UserService) {}
  public io: Server | Namespace
  private readonly logger = new Logger(RoomService.name, { timestamp: true })
  private readonly rooms: Map<string, Room> = new Map()

  // Private methods
  private createRoom(options?: RoomOptions & { roomId?: string }): Room {
    const { roomId, ...config } = options
    const id = roomId ?? uuidv4()
    if (this.rooms.has(id)) {
      throw new Error('ROOM ALREADY EXISTS')
    }
    const room = new Room(id, config)
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
    room.addPlayer(user)
    return user
  }
  private removeUserFromRoom(roomId: string, userId: string): void {
    const room = this.get(roomId)
    room.removePlayer(userId)
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
  onCreateRoom(user: User, client: Socket): WsResponse<RoomInfoDto> {
    try {
      const room = this.createRoom({ owner: user })
      // Remove user from previous room if any
      if (user.room?.id && user.room.id !== room.id) {
        this.removeUserFromRoom(user.room.id, user.id)
        client.leave(user.room.id)
        user.room = undefined
      }
      // Join socket to room
      user.room = { id: room.id, connected: true }
      this.joinSocketToRoom(client, room.id)

      const roomInfo = (): RoomInfoDto => ({
        id: room.id,
        owner: room.owner,
        players: room.getPlayers(),
        messages: room.getMessages(),
        maxNumPlayer: room.maxNumPlayer,
        currentGame: room.getGame(),
      })
      this.logger.debug('ROOM CREATED')
      this.logger.debug(roomInfo())
      return { event: WSE.USER_JOINED_ROOM_SUCCESS, data: roomInfo() }
    } catch (error) {
      this.logger.error(error)
      throw new WsException(error)
    }
  }
  onUserJoinRoom(user: User, roomId: string, client: Socket): WsResponse<RoomInfoDto> {
    // Check if room exists
    this.logger.debug('JOINING ROOM')
    this.logger.debug(user.name)
    this.logger.debug('In room' + roomId)
    const room = this.get(roomId)
    if (!room) {
      throw new WsException("Room doesn't exists")
    }

    const roomInfo = (): RoomInfoDto => ({
      id: room.id,
      owner: room.owner,
      players: room.getPlayers(),
      messages: room.getMessages(),
      maxNumPlayer: room.maxNumPlayer,
      currentGame: room.getGame(),
    })
    // Check if user already has a room
    if (user.room) {
      // If it's the same room, treat as reconnexion
      if (user.room.id === roomId) {
        if (room.hasPlayer(user.id)) {
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
  onNewMessage(message: string, client: Socket): void {
    const user = this.userService.get(client.data.userId)
    const room = this.getRoomFromUser(user)
    const newMessage: Omit<Message, 'id'> = { sender: user, content: message, sent_at: Date.now() }
    room.addMessage(newMessage)
    if (room.canGuess()) {
      room.makeGuess(newMessage.content, user.id)
    }
    this.io.in(room.id).emit(WSE.NEW_MESSAGE, newMessage)
  }
  onDrawingUpload(client: Socket, drawing: Blob): void | WsResponse {
    this.logger.debug('DRAWING SHARED')
    const user = this.userService.get(client.data.userId)
    const { id, name } = user
    const room = this.getRoomFromUser(user)
    if (room.canPlayerDraw(user)) {
      this.io.in(room.id).emit(WSE.UPLOAD_DRAWING, { drawing, user: { id, name } })
    } else {
      return { event: WSE.STOP_DRAW, data: undefined }
    }
  }
  onAskStartGame(client: Socket, gameName: GameName): void {
    const user = this.userService.getUserFromSocket(client)
    const room = this.getRoomFromUser(user)
    this.logger.debug('ASK START GAME')
    this.logger.debug(user.id)
    this.logger.debug(room.owner)

    if (user.id === room.owner) {
      room.setGame(gameName, this)
      room.startGame()
      return
    } else {
      throw new Error('Unauthorized')
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
