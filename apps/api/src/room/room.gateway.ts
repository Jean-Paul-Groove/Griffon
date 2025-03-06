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
import { WsFilter } from '../common/ws/ws.filter'
import { AuthGuard } from '../auth/auth.guard'
import { PlayerService } from '../player/player.service'
import { GameName, PlayerConnectionSuccessDto, WSE } from 'shared'
import { GameService } from '../game/game.service'
import { RoomGuard } from './room.guard'
import { ChatService } from '../chat/chat.service'

@UseGuards(AuthGuard)
@UseFilters(WsFilter)
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
  },
  pingTimeout: 60000,
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomService,
    private playerService: PlayerService,
    private gameService: GameService,
    private chatService: ChatService,
  ) {}
  private readonly logger = new Logger(RoomGateway.name)

  @WebSocketServer()
  io: Server

  afterInit(): void {
    this.roomService.io = this.io
    this.io.disconnectSockets()
    this.logger.log('Room gateway initialized')
  }
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Chek that player is known
      this.logger.debug('HANDLE CONNECT', client.data)
      const player = await this.playerService.getPlayerFromSocket(client)
      const playerInfo = this.playerService.generatePlauyerInfoDto(player)
      const data: PlayerConnectionSuccessDto = {
        event: WSE.CONNECTION_SUCCESS,
        arguments: { player: playerInfo },
      }
      this.roomService.emitToPlayer(player, data)
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
  // ROOM HANDLERS
  @SubscribeMessage(WSE.ASK_CREATE_ROOM)
  async handleCreateRoom(@ConnectedSocket() client: Socket): Promise<WsResponse> {
    this.logger.debug('ASK CREATE ROOM')
    const player = await this.playerService.get(client.data.playerId)
    return this.roomService.onCreateRoom(player, client)
  }

  @SubscribeMessage(WSE.ASK_JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody('roomId') roomId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse> {
    const player = await this.playerService.get(client.data.playerId)
    return this.roomService.onPlayerJoinRoom(player, roomId, client)
  }

  // CHAT HANDLERS

  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.NEW_MESSAGE)
  handleNewMessage(
    @MessageBody('message') message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.chatService.onNewChatMessage(message, client)
  }

  // GAME HANDLERS
  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.UPLOAD_DRAWING)
  async handledawingUpload(
    @ConnectedSocket() client: Socket,
    @MessageBody('drawing') drawing: Blob,
  ): Promise<WsResponse | void> {
    return this.gameService.onDrawingUpload(client, drawing)
  }

  @UseGuards(RoomGuard)
  @SubscribeMessage(WSE.ASK_START_GAME)
  async handleAskStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody('game') game: GameName,
  ): Promise<void> {
    this.gameService.onAskStartGame(client, game)
  }
}
