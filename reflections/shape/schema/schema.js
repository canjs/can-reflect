var canSymbol = require("can-symbol");
var typeReflections = require("../../type/type");
var getSetReflections = require("../../get-set/get-set");
var shapeReflections = require("../shape");

var getSchemaSymbol = canSymbol.for("can.getSchema");

function comparator(a, b) {
    return a.localeCompare(b);
}

function sort(obj) {
    if(typeReflections.isPrimitive(obj)) {
        return obj;
    }
    var out;
    if (typeReflections.isListLike(obj)) {
        out = [];
        shapeReflections.eachKey(obj, function(item){
            out.push(sort(item));
        });
        return out;
    }
    if( typeReflections.isMapLike(obj) ) {

        out = {};

        shapeReflections.getOwnKeys(obj).sort(comparator).forEach(function (key) {
            out[key] = sort( getSetReflections.getKeyValue(obj, key) );
        });

        return out;
    }


    return obj;
}

var schemaReflections =  {
    /**
	 * @function can-reflect.getSchema getSchema
	 * @parent can-reflect/shape
	 * @description Returns the schema for a type or value.
	 *
	 * @signature `getSchema(valueOrType)`
	 *
     * Calls the `@can.getSchema` property on the `valueOrType` argument. If it's not available and
     * `valueOrType` has a `constructor` property, calls the `constructor[@can.getSchema]`
     * and returns the result.
     *
     * ```js
     * import canReflect from "can-reflect";
     *
     * var Type = DefineMap.extend({
     *   name: "string",
     *   id: "number"
     * });
     *
     * canReflect.getSchema( Type ) //-> {
     * //   type: "map",
     * //   keys: {
     * //     name: MaybeString
     * //     id: MaybeNumber
     * //   }
     * // }
     * ```
	 *
	 *
	 * @param  {Object|Function} valueOrType A value, constructor function, or class to get the schema from.
	 * @return {Object} A schema. A schema for a [can-reflect.isMapLike] looks like:
     *
     *
     * ```js
     * {
     *   type: "map",
     *   identity: ["id"],
     *   keys: {
     *     id: Number,
     *     name: String,
     *     complete: Boolean,
     *     owner: User
     *   }
     * }
     * ```
	 */
    getSchema: function(type){
        var getSchema = type[getSchemaSymbol];
        if(getSchema === undefined && type.constructor != null) {
            getSchema = type.constructor[getSchemaSymbol];
        }
        return getSchema.call(type);
    },
    /**
	 * @function can-reflect.getIdentity getIdentity
	 * @parent can-reflect/shape
	 * @description Get a unique primitive representing an object.
	 *
	 * @signature `getIdentity( object [,schema] )`
	 *
	 * This uses the object's schema, or the provided schema to return a unique string or number that
     * represents the object.
     *
     * ```js
     * import canReflect from "can-reflect";
     *
     * canReflect.getIdentity({id: 5}, {identity: ["id"]}) //-> 5
     * ```
     *
     * If the schema has multiple identity keys, the identity keys and values
     * are return stringified (and sorted):
     *
     * ```js
     * canReflect.getIdentity(
     *   {z: "Z", a: "A", foo: "bar"},
     *   {identity: ["a","b"]}) //-> '{"a":"A","b":"B"}'
     * ```
	 *
	 * @param  {Object|Function} object A map-like object.
     * @param {Object} [schema] A schema object with an `identity` array of the unique
     * keys of the object like:
     *   ```js
     *   {identity: ["id"]}
     *   ```
	 * @return {Number|String} A value that uniquely represents the object.
	 */
    getIdentity: function(value, schema){
        schema = schema || schemaReflections.getSchema(value);
        if(schema === undefined) {
            throw new Error("can-reflect.getIdentity - Unable to find a schema for the given value.");
        }

        var identity = schema.identity;
        if(!identity || identity.length === 0) {
            throw new Error("can-reflect.getIdentity - Provided schema lacks an identity property.");
        } else if(identity.length === 1) {
            return getSetReflections.getKeyValue(value, identity[0]);
        } else {
            var id = {};
            identity.forEach(function(key){
                id[key] = getSetReflections.getKeyValue(value, key);
            });
            return JSON.stringify(schemaReflections.cloneKeySort(id));
        }
    },
    /**
	 * @function can-reflect.cloneKeySort cloneKeySort
	 * @parent can-reflect/shape
	 * @description Copy a value while sorting its keys.
	 *
	 * @signature `cloneSorted(value)`
	 *
     * `cloneSorted` returns a copy of `value` with its [can-reflect.isMapLike]
     * key values sorted. If you just want a copy of a value,
     * use [can-reflect.serialize].
     *
     * ```js
     * import canRefect from "can-reflect";
     *
     * canReflect.cloneKeySort({z: "Z", a: "A"}) //-> {a: "A", z: "Z"}
     * ```
     *
     * Nested objects are also sorted.
	 *
     * This is useful if you need to store a representation of an object that can be used as a
     * key.
	 *
	 * @param  {Object} value An object or array.
	 * @return {Object} A copy of the object with its keys sorted.
	 */
    cloneKeySort: function(obj) {
        return sort(obj);
    }
};
module.exports = schemaReflections;
