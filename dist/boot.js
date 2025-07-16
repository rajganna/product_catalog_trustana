"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boot = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const requestContext = require("request-context");
const log_error_response_1 = require("./exception-filters/log-error-response");
const boot = async (app) => {
    const logger = new common_1.Logger('App Logger');
    if (process.env.NODE_ENV !== 'local') {
        app.useLogger(logger);
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        validateCustomDecorators: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new log_error_response_1.OutgoingErrorResponseLogger());
    app.setGlobalPrefix('/api/v1');
    app.enableCors();
    app.use(requestContext.middleware('request'));
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
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
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            customSiteTitle: 'Product Catalog API Documentation',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: 'none',
                filter: true,
                showRequestHeaders: true,
                tryItOutEnabled: true,
            },
        });
        logger.log('Swagger UI is available at http://localhost:3000/api/docs');
    }
};
exports.boot = boot;
//# sourceMappingURL=boot.js.map