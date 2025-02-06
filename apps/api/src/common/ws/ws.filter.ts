import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'

@Catch(WsException)
export class WsFilter implements ExceptionFilter {
  constructor() {}
  private readonly logger = new Logger(WsFilter.name)

  catch(exception: WsException, host: ArgumentsHost): void {
    this.logger.log(exception)
    this.logger.log(host)
  }
}
