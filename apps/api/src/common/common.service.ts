import { MemoryStorageFile } from '@blazity/nest-file-fastify'
import { Injectable, Logger } from '@nestjs/common'
import * as path from 'path'
import * as sharp from 'sharp'
import * as fs from 'fs'
import { Server, Socket } from 'socket.io'
import { SocketDto } from 'shared'
import { Player } from '../player/entities/player.entity'

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name)
  public io: Server

  // Files

  /**
   * Convert an image to Webp and to a designated size
   * then saves it with the provided prefix  and id into the upload folder.
   * Can save into a private folder **Privacy folder not implemented yet**
   * or into the public folder. Will replace any picture with same path.
   * @param {MemoryStorageFile} image The image uploaded
   * @param {string} id The id of the image (either playerId of avatar of GameId for game illustration)
   * @param {boolean} shared If the image is public
   * @param {string} filePrefix The prefix of the image, ie 'avatar'
   * @param {number} pictureSize? The size in pixel of the final image width, default 800
   * @returns {string} Returns the location of the image for the url.
   */
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
      this.createDirectoryIfNotExist(path.join(__dirname, '..', 'uploads', 'private', id))
      location = path.join('uploads', 'private', id, filename)
    }
    const img = sharp(image.buffer).resize(size).webp()
    await img.toFile(path.join(__dirname, '..', location))

    return location
  }

  /**
   * Creates a directory if the specified one does not exist
   * Used for private folders
   * @param {string} location The location of the directory
   * @returns {boolean} Returns true if creation is succesful
   */
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
   * Creates the needed directory on init
   * if they don't exist
   * @returns {void}
   */
  initFileDirectories(): void {
    this.createDirectoryIfNotExist(path.join(__dirname, '..', 'uploads'))
    this.createDirectoryIfNotExist(path.join(__dirname, '..', 'uploads', 'public'))
    this.createDirectoryIfNotExist(path.join(__dirname, '..', 'uploads', 'private'))
  }
  // Socket

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

  /**
   * Retrieve the associated socket of a player if any
   * @param {string} playerId The Id of the player
   * @returns {Socket | undefined}
   */
  getSocketFromPlayer(playerId: string): Socket | undefined {
    const sockets = this.io.sockets.sockets

    return (Array.from(sockets.values()) as Socket[]).find(
      (socket) => socket.data.playerId === playerId,
    )
  }

  /**
   * Sends an event and data to the players of a room.
   * @param {string} roomId The Id of the Room
   * @param {SocketDto} data The Dto data and event to send
   * @returns {any}
   */
  emitToRoom(roomId: string, data: SocketDto): void {
    this.io.in(roomId).emit(data.event, data.arguments)
  }

  /**
   * Sends an event and data to a player.
   * @param {playerId} playerId The Id of the player
   * @param {SocketDto} data The Dto data and event to send
   * @returns {void}
   */
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
