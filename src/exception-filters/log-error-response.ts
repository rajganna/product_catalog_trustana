import {
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  ExceptionFilter,
} from '@nestjs/common'

const logger = new Logger('Outgoing Error Response Logger')

@Catch(HttpException)
export class OutgoingErrorResponseLogger implements ExceptionFilter {
  public catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()

    if (status >= 400 && status < 500) {
      logger.warn({
        message: 'Incoming Request Failed',
        exception: exception.message,
        status,
      })
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message,
    })
  }
}
