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
exports.HealthService = exports.Status = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nestjs_config_1 = require("nestjs-config");
var Status;
(function (Status) {
    Status["OK"] = "ok";
    Status["FAILED"] = "failed";
})(Status || (exports.Status = Status = {}));
let HealthService = class HealthService {
    constructor(config, connection) {
        this.config = config;
        this.connection = connection;
        this.logger = new common_1.Logger('HealthService');
    }
    async healthResult() {
        let dbStatus;
        try {
            const queryRes = await this.connection.query('SELECT 1');
            dbStatus = queryRes && queryRes.length === 1 ? Status.OK : Status.FAILED;
        }
        catch (e) {
            this.logger.error(e.stack);
            dbStatus = Status.FAILED;
        }
        return {
            db: dbStatus,
            environment: this.config.get('config.environment'),
            region: this.config.get('config.region'),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [nestjs_config_1.ConfigService,
        typeorm_2.Connection])
], HealthService);
//# sourceMappingURL=health.service.js.map