import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'

@Catch(WsException)
export class WsFilter implements ExceptionFilter {
  constructor() {}
  private readonly logger = new Logger(WsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.log(exception)
  }
}
