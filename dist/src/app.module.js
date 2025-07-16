"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_config_1 = require("nestjs-config");
const path = require("path");
const attribute_controller_1 = require("./controllers/attribute.controller");
const category_controller_1 = require("./controllers/category.controller");
const health_controller_1 = require("./controllers/health.controller");
const product_controller_1 = require("./controllers/product.controller");
const seed_controller_1 = require("./controllers/seed.controller");
const entities_1 = require("./entities");
const attribute_service_1 = require("./services/attribute.service");
const cache_service_1 = require("./services/cache.service");
const category_service_1 = require("./services/category.service");
const health_service_1 = require("./services/health.service");
const product_service_1 = require("./services/product.service");
const seed_service_1 = require("./services/seed.service");
require('dotenv').config();
let AppModule = class AppModule {
    configure(_consumer) {
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_config_1.ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        type: 'postgres',
                        host: (_a = process.env.DB_HOST) !== null && _a !== void 0 ? _a : 'localhost',
                        port: parseInt((_b = process.env.DB_PORT) !== null && _b !== void 0 ? _b : '5432', 10),
                        username: (_c = process.env.DB_USERNAME) !== null && _c !== void 0 ? _c : 'root',
                        password: (_d = process.env.DB_PASSWORD) !== null && _d !== void 0 ? _d : 'secret',
                        database: (_e = process.env.DB_NAME) !== null && _e !== void 0 ? _e : 'product_service',
                        entities: [
                            entities_1.Category,
                            entities_1.Attribute,
                            entities_1.Product,
                            entities_1.CategoryAttribute,
                            entities_1.ProductAttributeValue,
                        ],
                        synchronize: process.env.NODE_ENV === 'local',
                        retryAttempts: 3,
                        retryDelay: 3000,
                        autoLoadEntities: false,
                        logging: process.env.NODE_ENV === 'local' ? ['query', 'error'] : ['error'],
                        ssl: false,
                    });
                },
            }),
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.Category,
                entities_1.Attribute,
                entities_1.Product,
                entities_1.CategoryAttribute,
                entities_1.ProductAttributeValue,
            ]),
        ],
        controllers: [
            health_controller_1.HealthController,
            attribute_controller_1.AttributeController,
            category_controller_1.CategoryController,
            product_controller_1.ProductController,
            seed_controller_1.SeedController,
        ],
        providers: [
            health_service_1.HealthService,
            attribute_service_1.AttributeService,
            category_service_1.CategoryService,
            product_service_1.ProductService,
            seed_service_1.SeedService,
            cache_service_1.CacheService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map