"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const boot_1 = require("./boot");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'warn', 'error'],
    });
    await (0, boot_1.boot)(app);
    await app.listen(3000);
    console.log('Application is running on: http://localhost:3000');
}
void bootstrap();
//# sourceMappingURL=main.js.map