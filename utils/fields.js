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
export const getFilteredModelFields = (tableFields, assignableFields) => {
    let filteredFields = {};

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

    return {
        ...filteredFields,
        created_at: 'string',
        updated_at: 'string',
        deleted_at: 'string'
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