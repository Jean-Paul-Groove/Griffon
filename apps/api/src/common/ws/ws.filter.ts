import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io-client'

@Catch(WsException)
export class WsFilter implements ExceptionFilter {
  constructor() {}
  private readonly logger = new Logger(WsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.log(exception)
    if (exception instanceof WsException) {
      const client = host.switchToWs().getClient<Socket>()
      if (client && exception.message) {
        client.emit(exception.message)
      }
    }
  }
}
