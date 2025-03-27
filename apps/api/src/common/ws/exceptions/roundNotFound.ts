import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class RoundNotFoundWsException extends WsException {
  constructor() {
    super(WSE.ROUND_NOT_FOUND)
  }
}
