import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class PlayerNotFoundWsException extends WsException {
  constructor() {
    super(WSE.PLAYER_NOT_FOUND)
  }
}
