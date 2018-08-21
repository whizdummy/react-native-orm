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
        fieldFormat += getSqlFieldDataType(val) + (index == fieldSplit.length - 1 ? '' : ' ');
    });

    return fieldFormat;
}