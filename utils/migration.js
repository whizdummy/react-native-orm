import { formatTimestamp } from './timestamp';

export const createMigrationTable = async (databaseInstance) => {
    return new Promise(async (resolve, reject) => {
        try {
            await databaseInstance.transaction(async (tx) => {
                await tx.executeSql(
                    `
                        CREATE TABLE IF NOT EXISTS Migration
                        (
                            id INTEGER PRIMARY KEY,
                            table_name VARCHAR(255),
                            version INTEGER,
                            type VARCHAR(255),
                            description TEXT,
                            created_at TEXT,
                            updated_at TEXT
                        );
                    `
                );
            });

            return resolve({
                statusCode: 200,
                message:    'Migration table successfully created.',
                data:       {}
            });
        } catch (err) {
            console.log('createMigrationTable error:', err);

            return reject({
                statusCode: 500,
                message:    'Migration table creation error'
            });
        }
    });
}

export const createMigrationTableRecord = async (databaseInstance, tableName, version, type, description = '') => {
    return new Promise(async (resolve, reject) => {
        try {
            await databaseInstance.transaction(async (tx) => {
                await tx.executeSql(
                    `
                        INSERT INTO Migration
                        (
                            table_name,
                            version,
                            type,
                            description,
                            created_at,
                            updated_at
                        ) VALUES
                        (?, ?, ?, ?, ?, ?);
                    `,
                    [
                        tableName,
                        version,
                        type,
                        description,
                        formatTimestamp(new Date()),
                        formatTimestamp(new Date())
                    ]
                );
            });

            return resolve({
                statusCode: 200,
                message:    'Migration record successfully created.',
                data:       {}
            });
        } catch (err) {
            console.log('createMigrationTableRecord error:', err);

            return reject({
                statusCode: 500,
                message:    'Migration record creation error'
            });
        }
    });
}

export const hasExistingMigrationTableRecord = async (databaseInstance, tableName, version, type) => {
    return new Promise(async (resolve, reject) => {
        try {
            await databaseInstance.transaction(async (tx) => {
                const queryRes = await tx.executeSql(
                    `
                        SELECT COUNT(id) AS count
                        FROM Migration
                        WHERE table_name = ?
                        AND version = ?
                        AND type = ?;
                    `,
                    [
                        tableName,
                        version,
                        type
                    ]
                );

                return resolve({
                    statusCode: 200,
                    message:    'Existing migration record successfully checked.',
                    data:       (queryRes[1].rows.item(0)).count > 0
                });
            });
        } catch (err) {
            console.log('hasExistingMigrationTableRecord error:', err);

            return resolve({
                statusCode: 500,
                message:    'Existing migration record checking failed.'
            });
        }
    });
}