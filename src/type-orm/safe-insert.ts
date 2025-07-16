import { Class } from 'type-fest';
import { EntityManager, InsertResult } from 'typeorm';

export interface SafeInsertOptions {
  callListeners?: boolean;
  onConflict?: 'DO_NOTHING' | 'REPLACE';
}


export const safeInsert = async <T>(
  manager: EntityManager,
  type: Class<T>,
  data: Partial<T> | Partial<T>[],
  options: SafeInsertOptions = { callListeners: false },
): Promise<InsertResult> => {
  // Validate input
  if (!manager) {
    throw new Error('EntityManager is required');
  }
  if (!type) {
    throw new Error('Entity type is required');
  }

  const hasData = Array.isArray(data) ? data.length > 0 : data != null

  if (!hasData) {
    return {
      generatedMaps: [],
      identifiers: [],
      raw: 0,
    };
  }

  try {
    if (options.callListeners) {
      return await manager.insert(type, data as any);
    } else {
      const queryBuilder = manager
        .createQueryBuilder()
        .insert()
        .into(type)
        .values(data as any)
        .callListeners(false);

      // Handle conflict resolution
      if (options.onConflict === 'DO_NOTHING') {
        queryBuilder.orIgnore();
      } else if (options.onConflict === 'REPLACE') {
        queryBuilder.orUpdate(['id']); // Assuming 'id' is the primary key
      }

      return await queryBuilder.execute();
    }
  } catch (error) {
    // Add context to the error
    const dataCount = Array.isArray(data) ? data.length : 1;
    throw new Error(
      `Failed to insert ${dataCount} record(s) into ${type.name}: ${error.message}`
    );
  }
};
