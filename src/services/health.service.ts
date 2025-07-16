import { Injectable, Logger } from '@nestjs/common'
import { InjectConnection } from '@nestjs/typeorm'
import { Connection } from 'typeorm'
import { ConfigService } from 'nestjs-config'

export enum Status {
  OK = 'ok',
  FAILED = 'failed',
}

export interface IHealthResult {
  db: Status
  environment: string
  region: 'US' | 'EMEA'
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger('HealthService')

  constructor(
    private readonly config: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  public async healthResult(): Promise<IHealthResult> {
    let dbStatus
    try {
      const queryRes = await this.connection.query('SELECT 1')
      dbStatus = queryRes && queryRes.length === 1 ? Status.OK : Status.FAILED
    } catch (e) {
      this.logger.error(e.stack)
      dbStatus = Status.FAILED
    }

    return {
      db: dbStatus,
      environment: this.config.get('config.environment'),
      region: this.config.get('config.region'),
    }
  }
}
