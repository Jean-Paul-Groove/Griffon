import { Logger, UseFilters, UseGuards } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'
import { RoomService } from './room.service'
import { WSE } from 'wse'
import { UserInfoDto } from '../user/dto/UserInfoDto'
import { WsFilter } from '../common/ws/ws.filter'
import { AuthGuard } from '../auth/auth.guard'
import { UserService } from '../user/user.service'

@UseGuards(AuthGuard)
@UseFilters(WsFilter)
@WebSocketGateway()
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomService,
    private userService: UserService,
  ) {}
  private readonly logger = new Logger(RoomGateway.name)

  @WebSocketServer() io: Server

  afterInit(): void {
    this.roomService.io = this.io
    this.io.disconnectSockets()
    this.logger.log('Room gateway initialized')
  }
  handleConnection(client: Socket): void {
    try {
      // Chek that user is known
      this.logger.debug('HANDLE CONNECT', client.data)
      const user = this.userService.getUserFromSocket(client)
      const userInfoDto = new UserInfoDto()
      userInfoDto.id = user.id
      userInfoDto.name = user.name
      if (user.avatar !== undefined) {
        userInfoDto.avatar = user.avatar
      }
      client.emit(WSE.CONNECTION_SUCCESS, userInfoDto)
    } catch (error) {
      this.logger.debug('HANDLE CONNECT ')
      this.logger.error(error)
      client.emit(WSE.INVALID_TOKEN)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      this.roomService.onDisconnectedClient(client)
    } catch (err) {
      this.logger.warn('HANDLE DISCONNECT', err)
    }
  }

  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse> {
    const user = this.userService.get(client.data.userId)
    return this.roomService.onUserJoinRoom(user, roomId, client)
  }

  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Blob,
  ): Promise<WsResponse> {
    this.logger.debug('DRAWING SHARED')
    const rooms = Array.from(client.rooms.values())
    this.logger.debug(rooms)
    const user = this.userService.get(client.data.userId)
    const { id, name } = user
    const room = this.roomService.getRoomFromUser(user)
    this.io.in(room.id).emit(WSE.UPLOAD_DRAWING, { drawing, user: { id, name } })
    return { event: 'SUCCESS', data: undefined }
  }
}
