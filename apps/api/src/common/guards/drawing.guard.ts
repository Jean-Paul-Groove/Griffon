import { Injectable, ExecutionContext, Logger, CanActivate } from '@nestjs/common'
import { WSE } from 'shared'
import { InvalidUpload } from '../../common/ws/exceptions/invalidUpload'

@Injectable()
export class DrawingGuard implements CanActivate {
  private readonly logger = new Logger(DrawingGuard.name)
  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs()
      const drawing: Buffer = client.getData().drawing
      if (!Buffer.isBuffer(drawing)) {
        throw new Error('Invalid drawing')
      }
      const signatureStart = drawing.subarray(0, 4)
      const signatureEnd = drawing.subarray(8, 12)
      if (
        Buffer.compare(signatureStart, Buffer.from('52494646', 'hex')) !== 0 ||
        Buffer.compare(signatureEnd, Buffer.from('57454250', 'hex')) !== 0
      ) {
        throw new Error('Invalid file signature')
      }
      return true
    } catch (error) {
      context.switchToWs().getClient()?.emit(WSE.STOP_DRAW)
      this.logger.error(error)
      throw new InvalidUpload()
    }
  }
}
