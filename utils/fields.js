/**
 * Formats SQL field type to a Model field
 * 
 * @param {string} sqlField 
 */
export const fromSqlField = (sqlField) => {
    const pattern = new RegExp(/^is_/g);

    let modelFieldFormat = [];

    // Boolean
    if (pattern.test(sqlField.name)) {
        modelFieldFormat.push('boolean');
    } else {
        modelFieldFormat.push(getModelFieldDataType(sqlField.type));
    }

    // Primary key
    if (sqlField.pk > 0) {
        modelFieldFormat.push('primary');
    }

    return modelFieldFormat.join('|');
}

/**
 * Gets Model field data type
 * 
 * @param {string} sqlFieldName 
 */
export const getModelFieldDataType = (sqlFieldName) => {
    let dataType = '';

    switch (sqlFieldName) {
        case 'VARCHAR(255)': {
            return 'string';
        }

        case 'TEXT': {
            return 'text';
        }
            
        case 'INTEGER': {
            return 'int';
        }

        default: {
            return dataType;
        }
    }
}

/**
 * Gets filtered model fields only
 * 
 * @param {Object} tableFields 
 * @param {Array|Object} assignableFields 
 */
export const getFilteredModelFields = (tableFields, assignableFields, excludeTimestamps = []) => {
    const timestamps = [
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    let filteredFields = {};
    let includedTimestamps = {};

    if (Array.isArray(assignableFields)) {
        for (let fieldName of Object.keys(tableFields)) {
            if ((assignableFields).includes(fieldName)) {
                filteredFields = {
                    ...filteredFields,
                    [fieldName]: tableFields[fieldName]
                };
            }
        }
    } else {
        filteredFields = assignableFields;
    }

    if (excludeTimestamps.length > 0) {
        timestamps.forEach(timestamp => {
            const excludedTimestamp = excludeTimestamps.find(exTimestamp => exTimestamp === timestamp);

            if (!excludedTimestamp) {
                includedTimestamps[timestamp] = 'string';
            }
        });
    } else {
        includedTimestamps = {
            created_at: 'string',
            updated_at: 'string',
            deleted_at: 'string'
        };
    }

    return {
        ...filteredFields,
        ...includedTimestamps
    };
}

/**
 * Gets SQL data type
 * 
 * @param {string} fieldName 
 */
export const getSqlFieldDataType = (fieldName) => {
    let dataType = '';

    switch (fieldName) {
        case 'primary': {
            return 'PRIMARY KEY';
        }

        case 'string': {
            return 'VARCHAR(255)';
        }

        case 'text': {
            return 'TEXT';
        }

        case 'boolean': { /* No break */ }
            
        case 'int': {
            return 'INTEGER';
        }

        case 'default': {
            return 'DEFAULT';
        }

        default: {
            return dataType;
        }
    }
}

/**
 * Formats Model field values to SQL field
 * 
 * @param {string} field 
 */
export const toSqlField = (field) => {
    const fieldSplit = field.split('|');

    let fieldFormat = '';

    fieldSplit.forEach((val, index) => {
        if ((/default/i).test(val)) {
            const defaultFieldSplit = val.split(':');
            const defaultValue = getDefaultValue(
                fieldSplit[index - 1],
                defaultFieldSplit.length > 1
                    ? defaultFieldSplit[1]
                    : ''
            );

            fieldFormat += (getSqlFieldDataType(defaultFieldSplit[0]) + ' ' + defaultValue)
                                + (index == fieldSplit.length - 1 ? '' : ' ');
        } else {
            fieldFormat += getSqlFieldDataType(val) + (index == fieldSplit.length - 1 ? '' : ' ');
        }
    });

    return fieldFormat;
}

const getDefaultValue = (dataType, defaultValue = '') => {
    if (dataType === 'boolean') {
        if (
            (
                !isNaN(defaultValue)
                && defaultValue > 0
            ) || (
                isNaN(defaultValue)
                && defaultValue.toLowerCase() === 'true'
            )
        ) {
            return 1;
        } else if (
            (
                !isNaN(defaultValue)
                && defaultValue <= 0
            ) || (
                isNaN(defaultValue)
                && defaultValue.toLowerCase() === 'false'
            ) || (
                isNaN(defaultValue)
                && !defaultValue
            )
        ) {
            return 0;
        }
    }

    return `'${ defaultValue }'`;
}