import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { boot } from './boot'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  })
  await boot(app)

  await app.listen(3000)
  // eslint-disable-next-line no-console
  console.log('Application is running on: http://localhost:3000')
}

void bootstrap()
