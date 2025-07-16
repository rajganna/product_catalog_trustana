import { Connection } from 'typeorm';
import { ConfigService } from 'nestjs-config';
export declare enum Status {
    OK = "ok",
    FAILED = "failed"
}
export interface IHealthResult {
    db: Status;
    environment: string;
    region: 'US' | 'EMEA';
}
export declare class HealthService {
    private readonly config;
    private readonly connection;
    private readonly logger;
    constructor(config: ConfigService, connection: Connection);
    healthResult(): Promise<IHealthResult>;
}
