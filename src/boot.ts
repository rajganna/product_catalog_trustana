import { INestApplication, Logger, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as requestContext from 'request-context'
import { OutgoingErrorResponseLogger } from './exception-filters/log-error-response'

export const boot = async (app: INestApplication) => {
  const logger = new Logger('App Logger')

  if (process.env.NODE_ENV !== 'local') {
    app.useLogger(logger)
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validateCustomDecorators: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Add the error response logger
  app.useGlobalFilters(new OutgoingErrorResponseLogger())
  app.setGlobalPrefix('/api/v1')
  app.enableCors()
  app.use(requestContext.middleware('request'))

  // Setup Swagger/OpenAPI documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Product Catalog Service API')
      .setDescription('A scalable, high-performance REST API for a product catalog system')
      .setVersion('1.0.0')
      .setContact('API Support', '', 'support@trustana.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Development')
      .addServer('https://api.trustana.com/products', 'Production')
      .addTag('Health', 'Health check endpoints')
      .addTag('Categories', 'Product category management')
      .addTag('Attributes', 'Product attribute management')
      .addTag('Products', 'Product management and search')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Product Catalog API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
    })

    logger.log('Swagger UI is available at http://localhost:3000/api/docs')
  }
}
