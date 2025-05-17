import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class ConcurrentConnectionsWsException extends WsException {
  constructor() {
    super(WSE.USER_ALREADY_CONNECTED)
  }
}
