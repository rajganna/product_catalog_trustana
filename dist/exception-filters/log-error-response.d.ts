import { ArgumentsHost, HttpException, ExceptionFilter } from '@nestjs/common';
export declare class OutgoingErrorResponseLogger implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void;
}
