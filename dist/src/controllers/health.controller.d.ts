import { HealthService } from '../services';
import { CacheService } from '../services/cache.service';
export declare class HealthController {
    private readonly healthService;
    private readonly cacheService;
    constructor(healthService: HealthService, cacheService: CacheService);
    health(res: any): Promise<void>;
    getCacheHealth(): Promise<{
        status: string;
        redis: Record<string, unknown>;
        cacheEnabled: boolean;
        timestamp: string;
    }>;
}
