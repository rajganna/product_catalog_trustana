import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { HealthService, IHealthResult, Status } from '../services'
import { CacheService } from '../services/cache.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('/')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the service and its dependencies'
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        db: { type: 'string', enum: ['OK', 'ERROR'] },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Service is unhealthy'
  })
  public async health(@Res() res): Promise<void> {
    const healthRes: IHealthResult = await this.healthService.healthResult()
    const httpCode =
      healthRes.db === Status.OK
        ? HttpStatus.OK
        : HttpStatus.INTERNAL_SERVER_ERROR

    res.status(httpCode).json(healthRes)
  }

  @Get('/cache')
  @ApiOperation({
    summary: 'Cache health check',
    description: 'Returns the health status of the cache service (Redis)'
  })
  @ApiResponse({
    status: 200,
    description: 'Cache health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        redis: { type: 'object' },
        cacheEnabled: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async getCacheHealth() {
    const isHealthy = await this.cacheService.isHealthy()
    const stats = await this.cacheService.getStats()

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      redis: stats,
      cacheEnabled: process.env.CACHE_ENABLED === 'true',
      timestamp: new Date().toISOString(),
    }
  }
}
