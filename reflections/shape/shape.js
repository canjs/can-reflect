var canSymbol = require("can-symbol");
var getSetReflections = require("../get-set/get-set");
var typeReflections = require("../type/type");


var serializeMap = null;

function makeSerializer(methodName, symbolsToCheck){

	return function serializer(value, MapType ){
		if( typeReflections.isPrimitive(value) ) {
			return value;
		}
		var firstSerialize;
		if(MapType && !serializeMap) {
			serializeMap = {
				toPlain: new MapType(),
				serialize: new MapType()
			};
			firstSerialize = true;
		}
		var serialized;
		if(typeReflections.isValueLike(value)) {
			serialized = this[methodName]( getSetReflections.getValue(value) );

		} else {
			var isListLike = typeReflections.isIteratorLike(value) || typeReflections.isMoreListLikeThanMapLike(value);
			serialized = isListLike ? [] : {};

			// handle maping to what is serialized
			if(serializeMap) {

				if( serializeMap[methodName].has(value) ) {
					return serializeMap[methodName].get(value);
				} else {
					serializeMap[methodName].set(value, serialized);
				}
			}

			for(var i = 0, len = symbolsToCheck.length ; i< len;i++) {
				var serializer = value[symbolsToCheck[i]];
				if(serializer) {
					return serializer.call(value, serialized);
				}
			}

			if( isListLike ) {
				this.eachIndex(value,function(childValue, index){
					serialized[index] = this[methodName](childValue);
				},this);
			} else {
				this.eachKey(value,function(childValue, prop){
					serialized[prop] = this[methodName](childValue);
				},this);
			}
		}

		if(firstSerialize) {
			serializeMap = null;
		}

		return serialized;
	};
}



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
	 *
	 * If `obj` is a List-like or an Iterator-like, `each` functions as [can-reflect/shape.eachIndex eachIndex],
	 * iterating over numeric indexes from 0 to `obj.length - 1` and calling `callback` with each property and
	 * index, optionally with `context` as `this` (defaulting to `obj`).  If not, `each` functions as
	 * [can-reflect/shape.eachKey eachKey],
	 * iterating over every Number and String key on `obj` and calling `callback` on each one.
	 *
	 * ```
	 * var foo = new DefineMap({ bar: "baz" });
	 * var quux = new DefineList([ "thud", "jeek" ]);
	 *
	 * canReflect.each(foo, console.log, console); // -> logs 'baz bar {foo}'
	 * canReflect.each(quux, console.log, console); // -> logs 'thud 0 {quux}'; logs 'jeek 1 {quux}'
	 * ```
	 *
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
	 * @signature `eachIndex(list, callback, context)`
	 *
	 * For each numeric index from 0 to `list.length - 1`, call `callback`, passing the current
	 * property value, the current index, and `list`, and optionally setting `this` as `context`
	 * if specified (otherwise use the current property value).
	 *
	 * ```
	 * var foo = new DefineList([ "bar", "baz" ]);
	 *
	 * canReflect.eachIndex(foo, console.log, console); // -> logs 'bar 0 {foo}'; logs 'baz 1 {foo}'
	 * ```
	 *
	 * @param  {ListLike}   list     The list to iterate over
	 * @param  {Function(*, Number)} callback a function that receives each item
	 * @param  {[Object]}   context  an optional `this` context for calling the callback
	 * @return {ListLike}   the original list
	 */
	eachIndex: function(list, callback, context){
		// each index in something list-like. Uses iterator if it has it.
		var iter, iterator = list[canSymbol.iterator];
		if(Array.isArray(list)) {
			// do nothing
		} else if(typeReflections.isIteratorLike(list)) {
			// we are looping through an iterator
			iter = list;
		} else if(iterator) {
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
	 *
	 * Convert the values of any Map-like or List-like into a JavaScript Array.  If a Map-like,
	 * key data is discarded and only value data is preserved.
	 *
	 * ```
	 * var foo = new DefineList(["bar", "baz"]);
	 * var quux = new DefineMap({ thud: "jeek" });
	 * ```
	 *
	 * canReflect.toArray(foo); // -> ["bar", "baz"]
	 * canReflect.toArray(quux): // -> ["jeek"]
	 *
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
	 *
	 * Iterate all own enumerable properties on Map-like `obj`
	 * (using [can-reflect/shape/getOwnEnumerableKeys canReflect.getOwnEnumerableKeys]), and call
	 * `callback` with the property value, the property key, and `obj`, and optionally setting
	 * `this` on the callback as `context` if provided, `obj` otherwise.
	 *
	 * ```
	 * var foo = new DefineMap({ bar: "baz" });
	 *
	 * canReflect.eachKey(foo, console.log, console); // logs 'baz bar {foo}'
	 * ```
	 *
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
	 *
	 * Return `true` if an object's own properties include the property key `key`, `false` otherwise.
	 * An object may implement [can-symbol/symbols/hasOwnKey @@@@can.hasOWnKey] to override default behavior.
	 * By default, `canReflect.hasOwnKey` will first look for
	 * [can-symbol/symbols/getOwnKey @@@@can.getOwnKey] on `obj`. If present, it will call `@@@@can.getOwnKey` and
	 * test `key` against the returned Array of keys.  If absent, `Object.prototype.hasOwnKey()` is used.
	 *
	 * ```
	 * var foo = new DefineMap({ "bar": "baz" });
	 *
	 * canReflect.hasOwnKey(foo, "bar"); // -> true
	 * canReflect.hasOwnKey(foo, "each"); // -> false
	 * foo.each // -> function each() {...}
	 * ```
	 *
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
	 *
	 * Return all keys on `obj` which have been defined as enumerable, either from explicitly setting
	 * `enumerable` on the property descriptor, or by using `=` to set the value of the property without
	 * a key descriptor, but excluding properties that only exist on `obj`'s prototype chaing.  The
	 * default behavior can be overridden by implementing
	 * [can-symbol/symbols/getOwnEnumerableKeys @@@@can.getOwnEnumerableKeys] on `obj`.  By default,
	 * `canReflect.getOwnEnumerableKeys` will use [can-symbol/symbols/getOwnKeys @@@@can.getOwnKeys] to
	 * retrieve the set of keys and [can-symbol/symbols/getOwnKeyDescriptor @@@@can.getOwnKeyDescriptor]
	 * to filter for those which are enumerable.  If either symbol is absent from `obj`, `Object.keys`
	 * is used.
	 *
	 * ```
	 * var foo = new DefineMap({ bar: "baz", [canSymbol.for("quux")]: "thud" });
	 * Object.defineProperty(foo, "jeek", {
	 *   enumerable: true,
	 *   value: "plonk"
	 * });
	 *
	 * canReflect.getOwnEnumerableKeys(foo); // -> ["bar", "jeek"]
	 * ```
	 *
	 * @param  {Object} obj Any Map-like object
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
	 *
	 * Return the Array of all String (not Symbol) keys from `obj`, whether they are enumerable or not.  If
	 * [can-symbol/symbols/getOwnKeys @@@@can.getOwnKeys] exists on `obj`, it is called to return
	 * the keys; otherwise, `Object.getOwnPropertyNames()` is used.
	 *
	 * ```
	 * var foo = new DefineMap({ bar: "baz", [canSymbol.for("quux")]: "thud" });
	 * Object.defineProperty(foo, "jeek", {
	 *   enumerable: false,
	 *   value: "plonk"
	 * });
	 *
	 * canReflect.getOwnKeys(foo); // -> ["bar", "jeek"]
	 * ```
	 *
	 * @param  {Object} obj Any MapLike object
	 * @return {Array} the Array of all String keys from the object.
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
	 *
	 *	Return the key descriptor for the property key `key` on the Map-like object `obj`. A key descriptor
	 *	is specified in ECMAScript 5 and contains keys for the property's `configurable` and `enumerable` states,
	 *	as well as either `value` and `writable` for value properties, or `get` and `set` for getter/setter properties.
	 *
	 * The default behavior can be overridden by implementing [can-symbol/symbols/getOwnKeyDescriptor @@@@can.getOwnKeyDescriptor]
	 * on `obj`; otherwise the default is to call `Object.getOwnKeyDescriptor()`.
	 *
	 * ```
	 * var foo = new DefineMap({ bar: "baz" });
	 *
	 * getOwnKeyDescriptor(foo, "bar"); // -> {configurable: true, writable: true, enumerable: true, value: "baz"}
	 * ```
	 *
	 * @param  {Object} obj Any object with named properties
	 * @param  {String} key The property name to look up on `obj`
	 * @return {Object}   A key descriptor object
	 */
	getOwnKeyDescriptor: function(obj, key){
		var getOwnKeyDescriptor = obj[canSymbol.for("can.getOwnKeyDescriptor")];
		if(getOwnKeyDescriptor) {
			return getOwnKeyDescriptor.call(obj, key);
		} else {
			return Object.getOwnPropertyDescriptor(obj, key);
		}
	},

	toPlain: makeSerializer("toPlain",[canSymbol.for("can.toPlain")]),
	serialize: makeSerializer("toPlain",[canSymbol.for("can.serialize"), canSymbol.for("can.toPlain")]),

	// walks up the whole property chain
	"in": function(){},
	getAllEnumerableKeys: function(){},
	getAllKeys: function(){}
};
shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
module.exports = shapeReflections;
