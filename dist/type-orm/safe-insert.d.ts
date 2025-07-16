import { Class } from 'type-fest';
import { EntityManager, InsertResult } from 'typeorm';
export interface SafeInsertOptions {
    callListeners?: boolean;
    onConflict?: 'DO_NOTHING' | 'REPLACE';
}
export declare const safeInsert: <T>(manager: EntityManager, type: Class<T>, data: Partial<T> | Partial<T>[], options?: SafeInsertOptions) => Promise<InsertResult>;
