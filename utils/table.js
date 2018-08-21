import { toSqlField } from "react-native-orm/utils/fields";
import {
    createMigrationTableRecord,
    hasExistingMigrationTableRecord
} from "react-native-orm/utils/migration";

export const changeTableRecord = (databaseInstance, tableName, data, type) => {
    return new Promise(async (resolve, reject) => {
        try {
            const hasExistingRecord = await hasExistingMigrationTableRecord(
                databaseInstance,
                tableName,
                data.version,
                type
            );

            if (!hasExistingRecord.data) {
                switch (type) {
                    case 'addColumns': {
                        await updateTableRecord(databaseInstance, tableName, data);
                        await createMigrationTableRecord(
                            databaseInstance,
                            tableName,
                            data.version,
                            'addColumns',
                            `Added new columns (Columns: ${ Object.keys(data.fields).join(', ') })`
                        );
    
                        break;
                    }
    
                    default: {}
                }
            }

            return resolve({
                statusCode: 200,
                message:    'Table record successfully changed.',
                data:       {}
            });
        } catch (err) {
            console.log('changeTableRecord error:', err);

            return reject({
                statusCode: 500,
                message:    'Table record change error'
            });
        }
    });
}

const updateTableRecord = (databaseInstance, tableName, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let sqlFormat = '';

            Object.keys(data.fields).forEach(fieldVal => {
                sqlFormat += `
                    ALTER TABLE ${ tableName }
                    ADD COLUMN ${ fieldVal } ${ toSqlField(data.fields[fieldVal]) };`;
            });

            await databaseInstance.transaction(async (tx) => {
                await tx.executeSql(sqlFormat);
            });

            return resolve();
        } catch (err) {
            console.log('updateTableRecord error:', err);

            return reject(err);
        }
    });
}