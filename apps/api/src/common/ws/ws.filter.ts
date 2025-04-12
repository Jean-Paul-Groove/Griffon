import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'

@Catch()
export class WsFilter implements ExceptionFilter {
  constructor() {}
  private readonly logger = new Logger(WsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient()

    const errorResponse: any = {
      status: 'error',
      message: 'An unknown error occurred',
    }

    if (exception instanceof WsException) {
      const error = exception.getError()
      if (typeof error === 'string') {
        errorResponse.message = error
      } else {
        if (typeof (error as any).message === 'string') {
          errorResponse.message = (error as any).message
        }
      }
    } // Handle HttpException (e.g., from guards, services, pipes)
    else if (exception instanceof HttpException) {
      const response = exception.getResponse()
      if (typeof response === 'string') {
        errorResponse.message = response
      } else if (typeof response === 'object') {
        errorResponse.message = (response as any).message || errorResponse.message
      }
    }

    // Handle generic errors
    else if (exception instanceof Error) {
      errorResponse.message = exception.message
    }
    this.logger.error(`[WebSocket Error]: ${errorResponse.message}`, (exception as any).stack || '')

    // Send the error back to the client
    if (client) {
      client.emit('error', errorResponse)
    }
  }
}
