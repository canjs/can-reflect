/*can-reflect@1.14.2#reflections/shape/schema/schema*/
var canSymbol = require('can-symbol');
var typeReflections = require('../../type/type.js');
var getSetReflections = require('../../get-set/get-set.js');
var shapeReflections = require('../shape.js');
var getSchemaSymbol = canSymbol.for('can.getSchema');
function comparator(a, b) {
    return a.localeCompare(b);
}
function sort(obj) {
    if (typeReflections.isPrimitive(obj)) {
        return obj;
    }
    var out;
    if (typeReflections.isListLike(obj)) {
        out = [];
        shapeReflections.eachKey(obj, function (item) {
            out.push(sort(item));
        });
        return out;
    }
    if (typeReflections.isMapLike(obj)) {
        out = {};
        shapeReflections.getOwnKeys(obj).sort(comparator).forEach(function (key) {
            out[key] = sort(getSetReflections.getKeyValue(obj, key));
        });
        return out;
    }
    return obj;
}
var schemaReflections = {
    getSchema: function (type) {
        var getSchema = type[getSchemaSymbol];
        if (getSchema === undefined) {
            type = type.constructor;
            getSchema = type && type[getSchemaSymbol];
        }
        return getSchema.call(type);
    },
    getIdentity: function (value, schema) {
        schema = schema || schemaReflections.getSchema(value);
        if (schema === undefined) {
            throw new Error('can-reflect.getIdentity - Unable to find a schema for the given value.');
        }
        var identity = schema.identity;
        if (!identity || identity.length === 0) {
            throw new Error('can-reflect.getIdentity - Provided schema lacks an identity property.');
        } else if (identity.length === 1) {
            return getSetReflections.getKeyValue(value, identity[0]);
        } else {
            var id = {};
            identity.forEach(function (key) {
                id[key] = getSetReflections.getKeyValue(value, key);
            });
            return JSON.stringify(schemaReflections.cloneKeySort(id));
        }
    },
    cloneKeySort: function (obj) {
        return sort(obj);
    }
};
module.exports = schemaReflections;