import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class RoomNotFoundWsException extends WsException {
  constructor() {
    super(WSE.ROOM_NOT_FOUND)
  }
}
