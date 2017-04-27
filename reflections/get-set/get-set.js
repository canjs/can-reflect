var canSymbol = require("can-symbol");
var typeReflections = require("../type/type");

var setKeyValueSymbol = canSymbol.for("can.setKeyValue"),
	getKeyValueSymbol = canSymbol.for("can.getKeyValue"),
	getValueSymbol = canSymbol.for("can.getValue"),
	setValueSymbol = canSymbol.for("can.setValue");

/**
 * @module can-reflect/get-set Get/Set
 * @parent can-reflect
 * @description Reflection functions for getters and setters on MapLikes, ListLikes, and ValueLikes.
 */
var reflections = {
	/**
	 * @function {Object, String, *} can-reflect/get-set.setKeyValue setKeyValue
	 * @parent can-reflect/get-set
	 * @description Set the value of a named property on a MapLike object.
	 *
	 * @signature `setValue(obj, key, value)`
	 * @param  {Object} obj   the object to set on
	 * @param  {String} key   the key for the property to set
	 * @param  {*} value      the value to set on the object
	 */
	setKeyValue: function(obj, key, value){
		if(typeof key === "symbol") {
			obj[key] = value;
			return;
		}
		var setKeyValue = obj[setKeyValueSymbol];
		if(setKeyValue) {
			return setKeyValue.call(obj, key, value);
		} else if( typeof key !== "symbol" && typeReflections.isSymbolLike(key) ) {
			Object.defineProperty(obj, key, {
				enumerable: false,
				configurable: true,
				value: value,
				writable: true
			});
		} else {
			obj[key] = value;
		}

	},
	/**
	 * @function {Object, String} can-reflect/get-set.getKeyValue getKeyValue
	 * @parent can-reflect/get-set
	 * @description Get the value of a named property on a MapLike object.
	 *
	 * @signature `getKeyValue(obj, key)`
	 * @param  {Object} obj   the object to get from
	 * @param  {String} key   the key of the property to get
	 */
	getKeyValue: function(obj, key) {
		var getKeyValue = obj[getKeyValueSymbol];
		if(getKeyValue) {
			return getKeyValue.call(obj, key);
		}
		return obj[key];
	},
	/**
	 * @function {Object, String} can-reflect/get-set.deleteKeyValue deleteKeyValue
	 * @parent can-reflect/get-set
	 * @description Delete a named property from a MapLike object.
	 *
	 * @signature `deleteKeyValue(obj, key)`
	 * @param  {Object} obj   the object to delete on
	 * @param  {String} key   the key for the property to delete
	 */
	deleteKeyValue: function(obj, key) {
		var deleteKeyValue = obj[canSymbol.for("can.deleteKeyValue")];
		if(deleteKeyValue) {
			return deleteKeyValue.call(obj, key);
		}
		delete obj[key];
	},
	/**
	 * @function {Object} can-reflect/get-set.getValue getValue
	 * @parent can-reflect/get-set
	 * @description Get the value of an object with a gettable value
	 *
	 * @signature `getValue(obj)`
	 * @param  {Object} obj   the object to get from
	 */
	getValue: function(value){
		if(typeReflections.isPrimitive(value)) {
			return value;
		}
		var getValue = value[getValueSymbol];
		if(getValue) {
			return getValue.call(value);
		}
		return value;
	},
	/**
	 * @function {Object, *} can-reflect/get-set.setValue setValue
	 * @parent can-reflect/get-set
	 * @description Set the value of a mutable object.
	 *
	 * @signature `setValue(obj, value)`
	 * @param  {Object} obj   the object to set on
	 * @param  {*} value      the value to set for the object
	 */
	setValue: function(item, value){
		var setValue = item && item[setValueSymbol];
		if(setValue) {
			return setValue.call(item, value);
		} else {
			throw new Error("can-reflect.setValue - Can not set value.");
		}
	}
};
/**
 * @function {Object, String} can-reflect/get-set.get get
 * @description an alias for [can-reflect/get-set.getKeyValue getKeyValue]
 */
reflections.get = reflections.getKeyValue;
/**
 * @function {Object, String} can-reflect/get-set.set set
 * @description an alias for [can-reflect/get-set.setKeyValue setKeyValue]
 */
reflections.set = reflections.setKeyValue;
/**
 * @function {Object, String} can-reflect/get-set.delete delete
 * @description an alias for [can-reflect/get-set.deleteKeyValue deleteKeyValue]
 */
reflections["delete"] = reflections.deleteKeyValue;

module.exports = reflections;
