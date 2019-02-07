import SQLite from 'react-native-sqlite-storage';

import { toSqlField } from './utils/fields';
import {
    createMigrationTable,
    createMigrationTableRecord
} from 'react-native-orm/utils/migration';
import { changeTableRecord } from 'react-native-orm/utils/table';
import { isEmpty } from 'react-native-orm/utils/checker';

export class Schema {
    constructor(props = {}) {
        // SQLite configuration
        SQLite.DEBUG(props.debug || false);
        SQLite.enablePromise(true);

        if (!props.databaseName) {
            throw new Error('Database name is required.');
        }

        // Database configuration
        this._databaseName      = props.databaseName;
        this._databaseInstance  = null;
        this._isPrepopulated    = props.isPrepopulated || false;
        this._location          = props.location || 'default';

        if (
            props.hasOwnProperty('prepDbLocation')
            && !props.hasOwnProperty('isPrepopulated')
        ) {
            throw new Error('"isPrepopulated" attribute is required.');
        }

        if (props.isPrepopulated) {
            this._prepDbLocation = !props.hasOwnProperty('prepDbLocation')
                                        ? 1 // Default location (www)
                                        : props.prepDbLocation;
        }

        this.open = this.open.bind(this);
        this.createTable = this.createTable.bind(this);
    }

    /**
     * Opens (if already exist) or creates (if does not exist) database
     */
    async open() {
        try {
            const openDbRes = await SQLite.openDatabase(
                this._isPrepopulated
                    ? {
                        name:               this._databaseName,
                        createFromLocation: this._prepDbLocation
                    }
                    : {
                        name:       this._databaseName,
                        location:   this._location
                    }
            );

            this._databaseInstance = openDbRes;

            await createMigrationTable(this._databaseInstance);

            return Promise.resolve({
                statusCode: 200,
                message: 'Database opened successfully.',
                data: openDbRes
            });
        } catch (err) {
            console.log('createDatabase error:', err);

            return Promise.reject({
                statusCode: 500,
                message: 'Unable to open database.'
            })
        }
    }

    /**
     * Creates new table via model
     * 
     * @param {Model} model
     */
    createTable(model) {
        return new Promise(async (resolve, reject) => {
            // Add default timestamps
            const fields = {
                ...model.getModelFields(),
                created_at: 'string',
                updated_at: 'string',
                deleted_at: 'string'
            };

            let sqlFieldFormat = '';

            // Format to SQL field
            Object.keys(fields).forEach((fieldVal, fieldIndex) => {
                sqlFieldFormat += `${ fieldVal } ${toSqlField(fields[fieldVal])}`
                    + ( 
                        fieldIndex === Object.keys(fields).length - 1
                            ? ''
                            : ', '
                    );
            });

            try {
                let tableInfoRes = '';

                await (this._databaseInstance).transaction(async (tx) => {
                    // Check table info (If existing)
                    tableInfoRes = await tx.executeSql(
                        `PRAGMA table_info('${ model.getModelName() }')`
                    );
                });

                await (this._databaseInstance).transaction(async (tx) => {
                    if (tableInfoRes[1].rows.length === 0) {
                        // Create table
                        await tx.executeSql('CREATE TABLE IF NOT EXISTS '
                            + model.getModelName()
                            + '(' + sqlFieldFormat + ');'
                        );

                        // Create migration record ("createTable" type)
                        await createMigrationTableRecord(
                            this._databaseInstance,
                            model.getModelName(),
                            1,
                            'createTable',
                            `Created new table (Columns: ${ Object.keys(fields).join(', ') })`
                        );
                    } else if (
                        typeof model.addColumns === 'function'
                        && !isEmpty(model.addColumns())
                        // && !isEmpty(model.addColumns()).version
                        // && !isEmpty(model.addColumns()).fields
                    ) {
                        // Add new columns

                        model.addColumns().forEach(async(addedColumnDetails) => {
                            if(
                                !isEmpty(addedColumnDetails).version
                                && !isEmpty(addedColumnDetails).fields
                            ){
                                // console.log("add columns", addedColumnDetails)
                                await changeTableRecord(
                                    this._databaseInstance,
                                    model.getModelName(),
                                    addedColumnDetails,
                                    'addColumns'
                                );
                            }
                        })

                    }
                });
            } catch (err) {
                console.log('Database transaction error (createTable):', err);

                return reject({
                    statusCode: 500,
                    message: 'An error occurred.'
                });
            }

            return resolve({
                statusCode: 200,
                message: 'Table successfully created',
                data: {
                    modelName: model.getModelName(),
                    fields
                }
            });
        });
    }
}