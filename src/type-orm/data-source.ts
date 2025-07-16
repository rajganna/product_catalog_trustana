// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DataSource } = require('typeorm')
import * as ormConfig from '../../ormconfig'

require('dotenv').config()

// Type definition for DataSource to provide better intellisense
interface IDataSource {
  isInitialized: boolean
  initialize(): Promise<IDataSource>
  destroy(): Promise<void>
  query(sql: string, parameters?: any[]): Promise<any>
  manager: any
}

let dataSource: IDataSource | null = null

export async function getDataSource(): Promise<IDataSource> {
  if (dataSource?.isInitialized) {
    return dataSource
  }

  // Create new DataSource instance if none exists
  dataSource = new DataSource({
    ...ormConfig,
    type: ormConfig.type,
    synchronize: false, // Never auto-sync in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    maxQueryExecutionTime: 5000, // Log slow queries
  }) as IDataSource

  // Initialize the data source
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
    console.log('TypeORM DataSource initialized successfully')
  }

  return dataSource
}

export async function closeConnection(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy()
    dataSource = null
    console.log('TypeORM DataSource closed successfully')
  }
}

// Legacy function for backward compatibility
export async function getConnection(): Promise<IDataSource> {
  return getDataSource()
}

// Helper function to check if connection is available
export function isConnected(): boolean {
  return dataSource?.isInitialized ?? false
}
