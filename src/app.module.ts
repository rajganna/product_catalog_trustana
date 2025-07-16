import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from 'nestjs-config'
import * as path from 'path'
import { AttributeController } from './controllers/attribute.controller'
import { CategoryController } from './controllers/category.controller'
import { HealthController } from './controllers/health.controller'
import { ProductController } from './controllers/product.controller'
import { SeedController } from './controllers/seed.controller'
import {
  Attribute,
  Category,
  CategoryAttribute,
  Product,
  ProductAttributeValue,
} from './entities'
import { AttributeService } from './services/attribute.service'
import { CacheService } from './services/cache.service'
import { CategoryService } from './services/category.service'
import { HealthService } from './services/health.service'
import { ProductService } from './services/product.service'
import { SeedService } from './services/seed.service'

// Load environment variables
require('dotenv').config()

@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? 'secret',
        database: process.env.DB_NAME ?? 'product_service',
        entities: [
          Category,
          Attribute,
          Product,
          CategoryAttribute,
          ProductAttributeValue,
        ],
        synchronize: process.env.NODE_ENV === 'local',
        retryAttempts: 3,
        retryDelay: 3000,
        autoLoadEntities: false,
        logging:
          process.env.NODE_ENV === 'local' ? ['query', 'error'] : ['error'],
        ssl: false,
      }),
    }),
    TypeOrmModule.forFeature([
      Category,
      Attribute,
      Product,
      CategoryAttribute,
      ProductAttributeValue,
    ]),
  ],
  controllers: [
    HealthController,
    AttributeController,
    CategoryController,
    ProductController,
    SeedController,
  ],
  providers: [
    HealthService,
    AttributeService,
    CategoryService,
    ProductService,
    SeedService,
    CacheService,
  ],
})
export class AppModule implements NestModule {
  public configure(_consumer: MiddlewareConsumer) {
    // Middleware configuration can be added here if needed
  }
}
