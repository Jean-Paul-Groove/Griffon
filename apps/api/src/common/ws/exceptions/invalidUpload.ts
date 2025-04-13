import { WsException } from '@nestjs/websockets'

export class InvalidUpload extends WsException {
  constructor() {
    super('invalid-upload')
  }
}
