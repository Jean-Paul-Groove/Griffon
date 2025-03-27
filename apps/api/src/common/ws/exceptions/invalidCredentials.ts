import { WsException } from '@nestjs/websockets'
import { WSE } from 'shared'

export class InvalidCredentialsWsException extends WsException {
  constructor() {
    super(WSE.INVALID_CREDENTIALS)
  }
}
