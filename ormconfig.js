const config = {
  name: 'default',
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  subscribers: [`${__dirname}/src/entities/subscribers/**/*{.ts,.js}`],
  entities: [`${__dirname}/src/entities/**/*.entity{.ts,.js}`],
  cli: {
    entitiesDir: `${__dirname}/src/entities/**/*.entity{.ts,.js}`,
    migrationsDir: 'migrations',
  },
  logging: ['error'],
}

if (process.env.IS_MIGRATION === 'true') {
  config.migrations = ['migrations/*.ts']
}

// Log SQL queries locally
if (process.env.NODE_ENV === 'local') {
  config.logging.push('query')
}

module.exports = config
