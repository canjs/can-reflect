var canSymbol = require("can-symbol");
var getSetReflections = require("../get-set/get-set");
var typeReflections = require("../type/type");

/**
 * @module can-reflect/shape Shape
 * @type {Object}
 * @description Reflections based on available and enumerable keys on an object
 *
 */
var shapeReflections = {
	/**
	 * @function {Object, function(*), [Object]} can-reflect/shape.each each
	 * @parent can-reflect/shape
	 * @description  Iterate a List-like or Map-like, calling `callback` on each keyed or indexed property
	 * 
	 * @signature `each(obj, callback, context)`
	 * @param  {Object}   obj     The object to iterate over
	 * @param  {Function(*, ValueLike)} callback a function that receives each item in the ListLike or MapLike
	 * @param  {[Object]}   context  an optional `this` context for calling the callback
	 * @return {Array} the result of calling [can-reflect/shape.eachIndex `eachIndex`] if `obj` is a ListLike, 
	 * or [can-reflect/shape.eachKey `eachKey`] if a MapLike.
	 */
	each: function(obj, callback, context){

		// if something is more "list like" .. use eachIndex
		if(typeReflections.isIteratorLike(obj) || typeReflections.isMoreListLikeThanMapLike(obj) ) {
			return this.eachIndex(obj,callback,context);
		} else {
			return this.eachKey(obj,callback,context);
		}
	},

	/**
	 * @function {ListLike, function(*), [Object]} can-reflect/shape.eachIndex eachIndex
	 * @parent can-reflect/shape
	 * @description  Iterate a ListLike calling `callback` on each numerically indexed element
	 * 
	 * @param  {ListLike}   list     The list to iterate over
	 * @param  {Function(*, Number)} callback a function that receives each item
	 * @param  {[Object]}   context  an optional `this` context for calling the callback
	 * @return {ListLike}   the original list          
	 */
	eachIndex: function(list, callback, context){
		// each index in something list-like. Uses iterator if it has it.
		var iter;
		if(Array.isArray(list)) {
			// do nothing
		} else if(typeReflections.isIteratorLike(list)) {
			// we are looping through an interator
			iter = list;
		} else {
			var iterator = list[canSymbol.iterator];
			iter = iterator.call(list);
		}
		// fast-path arrays
		if(iter) {
			var res, index = 0;

			while(!(res = iter.next()).done) {
				if( callback.call(context || list, res.value, index++, list) === false ){
					break;
				}
			}
		} else {
			for (var i  = 0, len = list.length; i < len; i++) {
				var item = list[i];
				if (callback.call(context || item, item, i, list) === false) {
					break;
				}
			}
		}
		return list;
	},
	/**
	 * @function can-reflect/shape.toArray toArray
	 * @parent can-reflect/shape
	 * @description  convert the values of any MapLike or ListLike into an array
	 * 
	 * @signature `toArray(obj)`
	 * @param  {Object} obj Any object, whether MapLike or ListLike
	 * @return {Array}  an array of the values of `obj`
	 */
	toArray: function(obj){
		var arr = [];
		this.each(obj, function(value){
			arr.push(value);
		});
		return arr;
	},
	/**
	 * @function can-reflect/shape.eachKey eachKey
	 * @parent can-reflect/shape
	 * @description Iterate over a MapLike, calling `callback` on each enumerable property
	 *
	 * @signature `eachKey(obj, callback, context)`
	 * @param  {Object}   obj   The object to iterate over
	 * @param  {Function(*, String)} callback The callback to call on each enumerable property value
	 * @param  {[Object]}   context  an optional `this` context for calling `callback`
	 * @return {Array}    the enumerable keys of `obj` as an Array
	 */
	eachKey: function(obj, callback, context){
		// each key in something map like
		// eachOwnEnumerableKey
		var enumerableKeys = this.getOwnEnumerableKeys(obj);
		return this.eachIndex(enumerableKeys, function(key){
			var value = getSetReflections.getKeyValue(obj, key);
			return callback.call(context || obj, value, key, obj);
		});
	},
	/**
	 * @function can-reflect/shape.hasOwnKey hasOwnKey
	 * @parent can-reflect/shape
	 * @description  Determine whether an object contains a key on itself, not only on its prototype chain
	 *
	 * @signature `hasOwnKey(obj, key)`
	 * @param  {Object} obj Any MapLike object
	 * @param  {String} key The key to look up on `obj`
	 * @return {Boolean} `true` if `obj`'s key set contains `key`, `false` otherwise
	 */
	"hasOwnKey": function(obj, key){
		// if a key or index
		// like has own property
		var hasOwnKey = obj[canSymbol.for("can.hasOwnKey")];
		if(hasOwnKey) {
			return hasOwnKey.call(obj, key);
		}
		var getOwnKeys = obj[canSymbol.for("can.getOwnKeys")];
		if( getOwnKeys ) {
			var found = false;
			this.eachIndex(getOwnKeys.call(obj), function(objKey){
				if(objKey === key) {
					found = true;
					return false;
				}
			});
			return found;
		}
		return obj.hasOwnProperty(key);
	},
	/**
	 * @function can-reflect/shape.getOwnEnumerableKeys getOwnEnumerableKeys
	 * @parent can-reflect/shape
	 * @description Return the list of keys which can be iterated over on an object
	 *
	 * @signature `getOwnEnumerableKeys(obj)`
	 * @param  {Object} obj Any MapLike object
	 * @return {Array} the Array of all enumerable keys from the object, either using 
	 * [can-symbol/symbols/getOwnEnumerableKeys `@@@@can.getOwnEnumerableKeys`] from `obj`, or filtering
	 * `obj`'s own keys for those which are enumerable.
	 */
	getOwnEnumerableKeys: function(obj){
		// own enumerable keys (aliased as keys)
		var getOwnEnumerableKeys = obj[canSymbol.for("can.getOwnEnumerableKeys")];
		if(getOwnEnumerableKeys) {
			return getOwnEnumerableKeys.call(obj);
		}
		if( obj[canSymbol.for("can.getOwnKeys")] && obj[canSymbol.for("can.getOwnKeyDescriptor")] ) {
			var keys = [];
			this.eachIndex(this.getOwnKeys(obj), function(key){
				var descriptor =  this.getOwnKeyDescriptor(obj, key);
				if(descriptor.enumerable) {
					keys.push(key);
				}
			}, this);

			return keys;
		} /*else if(obj[canSymbol.iterator]){
			var iter = obj[canSymbol.iterator](obj);
			var index = 0;
			var keys;
			return {
				next: function(){
					var res = iter.next();
					if(index++)
				}
			}
			while(!().done) {

				if( callback.call(context || list, res.value, index++, list) === false ){
					break;
				}
			}
		}*/ else {
			return Object.keys(obj);
		}
	},
	/**
	 * @function can-reflect/shape.getOwnKeys getOwnKeys
	 * @parent can-reflect/shape
	 * @description Return the list of keys on an object, whether or not they can be iterated over
	 *
	 * @signature `getOwnKeys(obj)`
	 * @param  {Object} obj Any MapLike object
	 * @return {Array} the Array of all keys from the object, either using 
	 * [can-symbol/symbols/getOwnEnumerableKeys `@@@@can.getOwnKeys`] from `obj`, or via
	 * `Object.getOwnPropertyNames`.
	 */
	getOwnKeys: function(obj){
		// own enumerable&non-enumerable keys (Object.getOwnPropertyNames)
		var getOwnKeys = obj[canSymbol.for("can.getOwnKeys")];
		if(getOwnKeys) {
			return getOwnKeys.call(obj);
		} else {
			return Object.getOwnPropertyNames(obj);
		}
	},
	/**
	 * @function can-reflect/shape.getOwnKeyDescriptor getOwnKeyDescriptor
	 * @parent can-reflect/shape
	 * @description Return a property descriptor for a named property on an object.
	 *
	 * @signature `getOwnKeyDescriptor(obj, key)`
	 * @param  {Object} obj Any object with named properties
	 * @param  {String} key The property name to look up on `obj`
	 * @return {Object}   An object with the property's `configurable` and `enumerable` states, as well as
	 * either `value` and `writable` for value properties, or `get` and `set` for getter/setters.
	 */
	getOwnKeyDescriptor: function(obj, key){
		var getOwnKeyDescriptor = obj[canSymbol.for("can.getOwnKeyDescriptor")];
		if(getOwnKeyDescriptor) {
			return getOwnKeyDescriptor.call(obj, key);
		} else {
			return Object.getOwnPropertyDescriptor(obj, key);
		}
	},


	// walks up the whole property chain
	"in": function(){},
	getAllEnumerableKeys: function(){},
	getAllKeys: function(){}
};
shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
module.exports = shapeReflections;
