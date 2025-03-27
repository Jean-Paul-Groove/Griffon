import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class UnauthorizedWsException extends WsException {
  constructor() {
    super(WSE.UNAUTHORIZED)
  }
}
