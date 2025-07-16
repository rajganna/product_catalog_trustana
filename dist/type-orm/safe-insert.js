"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeInsert = void 0;
const safeInsert = async (manager, type, data, options = { callListeners: false }) => {
    if (!manager) {
        throw new Error('EntityManager is required');
    }
    if (!type) {
        throw new Error('Entity type is required');
    }
    const hasData = Array.isArray(data) ? data.length > 0 : data != null;
    if (!hasData) {
        return {
            generatedMaps: [],
            identifiers: [],
            raw: 0,
        };
    }
    try {
        if (options.callListeners) {
            return await manager.insert(type, data);
        }
        else {
            const queryBuilder = manager
                .createQueryBuilder()
                .insert()
                .into(type)
                .values(data)
                .callListeners(false);
            if (options.onConflict === 'DO_NOTHING') {
                queryBuilder.orIgnore();
            }
            else if (options.onConflict === 'REPLACE') {
                queryBuilder.orUpdate(['id']);
            }
            return await queryBuilder.execute();
        }
    }
    catch (error) {
        const dataCount = Array.isArray(data) ? data.length : 1;
        throw new Error(`Failed to insert ${dataCount} record(s) into ${type.name}: ${error.message}`);
    }
};
exports.safeInsert = safeInsert;
//# sourceMappingURL=safe-insert.js.map