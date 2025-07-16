import { Connection } from 'typeorm';
export declare function getConnection(): Promise<Connection>;
export declare function closeConnection(): Promise<void>;
