import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class GameNotFoundWsException extends WsException {
  constructor() {
    super(WSE.GAME_NOT_FOUND)
  }
}
