import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { Injectable, Logger } from '@nestjs/common'
import * as path from 'path'
import * as sharp from 'sharp'
import fs from 'fs'
import { Server, Socket } from 'socket.io'
import { SocketDto } from 'shared'
import { Player } from '../player/entities/player.entity'

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name)
  public io: Server

  async uploadImage(
    image: MemoryStorageFile,
    id: string,
    shared: boolean,
    filePrefix: string,
    pictureSize?: number,
  ): Promise<string> {
    const size = pictureSize || 800
    if (!image) {
      return null
    }
    const filename = filePrefix + '-' + id + '.webp'
    let location = ''
    if (shared) {
      location = path.join('uploads', 'public', filename)
    } else {
      this.createDirectoryIfNotExist(path.join('uploads', 'private', id))
      location = path.join('uploads', 'private', id, filename)
    }
    const img = sharp(image.buffer).resize(size).webp()
    await img.toFile(location)

    return location
  }
  private createDirectoryIfNotExist(location: string): boolean {
    try {
      if (!fs.existsSync(location)) {
        fs.mkdirSync(location)
      }
      return true
    } catch (err) {
      this.logger.error(err)
      return false
    }
  }
  /**
   * Subscribe the player's socket to the room events
   * @param {Socket} client:Socket
   * @param {string} newRoomId:string
   * @returns {void}
   */
  joinSocketToRoom(client: Socket, newRoomId: string): void {
    // Leave previous socket room if any
    if (client.data.roomId !== newRoomId) {
      client.leave(client.data.roomId)
      client.data.roomId = newRoomId
    }
    // Join new one
    client.join(newRoomId)
  }

  /**
   * Unsubscribe a socket from a room events
   * @param {Socket} client:Socket Socket to unsubscribe
   * @param {string} roomId:string Id of the room
   * @returns {void}
   */
  removeSocketFromRoom(client: Socket, roomId: string): void {
    if (!client) {
      return
    }
    if (client?.data?.roomId) {
      client.data.roomId = null
    }
    client.leave(roomId)
  }
  getSocketFromPlayer(playerId: string): Socket | undefined {
    const sockets = this.io.sockets.sockets

    return (Array.from(sockets.values()) as Socket[]).find(
      (socket) => socket.data.playerId === playerId,
    )
  }
  emitToRoom(roomId: string, data: SocketDto): void {
    this.io.in(roomId).emit(data.event, data.arguments)
  }
  emitToPlayer(playerId: Player['id'], data: SocketDto): void {
    if (!playerId) {
      return
    }
    const client = this.getSocketFromPlayer(playerId)
    if (!client) {
      return
    }
    client.emit(data.event, data.arguments)
  }
}
