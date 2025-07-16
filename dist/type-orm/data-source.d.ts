interface IDataSource {
    isInitialized: boolean;
    initialize(): Promise<IDataSource>;
    destroy(): Promise<void>;
    query(sql: string, parameters?: any[]): Promise<any>;
    manager: any;
}
export declare function getDataSource(): Promise<IDataSource>;
export declare function closeConnection(): Promise<void>;
export declare function getConnection(): Promise<IDataSource>;
export declare function isConnected(): boolean;
export {};
