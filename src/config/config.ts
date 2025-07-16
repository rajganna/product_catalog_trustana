export default {
  environment: process.env.NODE_ENV ?? 'development',
  region: process.env.REGION ?? 'US',
  port: process.env.PORT ?? 3000,
}
