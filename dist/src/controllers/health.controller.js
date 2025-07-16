"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const services_1 = require("../services");
const cache_service_1 = require("../services/cache.service");
let HealthController = class HealthController {
    constructor(healthService, cacheService) {
        this.healthService = healthService;
        this.cacheService = cacheService;
    }
    async health(res) {
        const healthRes = await this.healthService.healthResult();
        const httpCode = healthRes.db === services_1.Status.OK
            ? common_1.HttpStatus.OK
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        res.status(httpCode).json(healthRes);
    }
    async getCacheHealth() {
        const isHealthy = await this.cacheService.isHealthy();
        const stats = await this.cacheService.getStats();
        return {
            status: isHealthy ? 'healthy' : 'unhealthy',
            redis: stats,
            cacheEnabled: process.env.CACHE_ENABLED === 'true',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('/'),
    (0, swagger_1.ApiOperation)({
        summary: 'Health check',
        description: 'Returns the health status of the service and its dependencies'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                db: { type: 'string', enum: ['OK', 'ERROR'] },
                timestamp: { type: 'string', format: 'date-time' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Service is unhealthy'
    }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('/cache'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cache health check',
        description: 'Returns the health status of the cache service (Redis)'
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getCacheHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [services_1.HealthService,
        cache_service_1.CacheService])
], HealthController);
//# sourceMappingURL=health.controller.js.map