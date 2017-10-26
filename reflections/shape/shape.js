var canSymbol = require("can-symbol");
var getSetReflections = require("../get-set/get-set");
var typeReflections = require("../type/type");
var helpers = require("../helpers");

var shapeReflections;

var shiftFirstArgumentToThis = function(func){
	return function(){
		var args = [this];
		args.push.apply(args, arguments);
		return func.apply(null,args);
	};
};

var getKeyValueSymbol = canSymbol.for("can.getKeyValue");
var shiftedGetKeyValue = shiftFirstArgumentToThis(getSetReflections.getKeyValue);
var setKeyValueSymbol = canSymbol.for("can.setKeyValue");
var shiftedSetKeyValue = shiftFirstArgumentToThis(getSetReflections.setKeyValue);

var sizeSymbol = canSymbol.for("can.size");

var serializeMap = null;

var hasUpdateSymbol = helpers.makeGetFirstSymbolValue(["can.updateDeep","can.assignDeep","can.setKeyValue"]);
var shouldUpdateOrAssign = function(obj){
	return typeReflections.isPlainObject(obj) || Array.isArray(obj) || !!hasUpdateSymbol(obj);
};

function isSerializable(obj){
	if (typeReflections.isPrimitive(obj)) {
		return true;
	}
	if(hasUpdateSymbol(obj)) {
		return false;
	}
	return typeReflections.isBuiltIn(obj) && !typeReflections.isPlainObject(obj);
}

// IE11 doesn't support primitives
var Object_Keys;
try{
	Object.keys(1);
	Object_Keys = Object.keys;
} catch(e) {
	Object_Keys = function(obj){
		if(typeReflections.isPrimitive(obj)) {
			return [];
		} else {
			return Object.keys(obj);
		}
	};
}

function makeSerializer(methodName, symbolsToCheck){

	return function serializer(value, MapType ){
		if (isSerializable(value)) {
			return value;
		}

		var firstSerialize;
		if(MapType && !serializeMap) {
			serializeMap = {
				unwrap: new MapType(),
				serialize: new MapType()
			};
			firstSerialize = true;
		}
		var serialized;
		if(typeReflections.isValueLike(value)) {
			serialized = this[methodName]( getSetReflections.getValue(value) );

		} else {
			// Date, RegEx and other Built-ins are handled above
			// only want to do something if it's intended to be serialized
			// or do nothing for a POJO

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
					var result =  serializer.call(value, serialized);
					if(firstSerialize) {
						serializeMap = null;
					}
					return result;
				}
			}

			if (typeof obj ==='function') {
				if(serializeMap) {
					serializeMap[methodName].set(value, value);
				}

				serialized = value;
			} else if( isListLike ) {
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

// returns a Map type of the keys mapped to true
var makeMap;
if(typeof Map !== "undefined") {
	makeMap = function(keys) {
		var map = new Map();
		shapeReflections.eachIndex(keys, function(key){
			map.set(key, true);
		})
		return map;
	};
} else {
	makeMap = function(keys) {
		var map = {};
		keys.forEach(function(key){
			map[key] = true;
		});

		return {
			get: function(key){
				return map[key];
			},
			set: function(key, value) {
				map[key] = value;
			},
			keys: function(){
				return keys
			}
		};
	};
}

// creates an optimized hasOwnKey lookup.
// If the object has hasOwnKey, then we just use that.
// Otherwise, try to put all keys in a map.
var fastHasOwnKey = function(obj){
	var hasOwnKey = obj[canSymbol.for("can.hasOwnKey")];
	if(hasOwnKey) {
		return hasOwnKey.bind(obj);
	} else {
		var map = makeMap( shapeReflections.getOwnEnumerableKeys(obj) );
		return function(key) {
			return map.get(key)
		};
	}
};


// combines patches if it makes sense
function addPatch(patches, patch) {
	var lastPatch = patches[patches.length -1];
	if(lastPatch) {
		// same number of deletes and counts as the index is back
		if(lastPatch.deleteCount === lastPatch.insert.length && (patch.index - lastPatch.index === lastPatch.deleteCount) ) {
			lastPatch.insert.push.apply(lastPatch.insert, patch.insert);
			lastPatch.deleteCount += patch.deleteCount;
			return;
		}
	}
	patches.push(patch);
}

function updateDeepList(target, source, isAssign) {
	var sourceArray = this.toArray(source);

	var patches = [],
		lastIndex = -1;
	this.eachIndex(target, function(curVal, index){
		lastIndex = index;
		if(index >= sourceArray.length) {
			if(!isAssign) {
				addPatch(patches, {index: index, deleteCount: sourceArray.length - index + 1, insert: []});
			}
			return false;
		}
		var newVal = sourceArray[index];
		if( typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false ) {
			addPatch(patches, {index: index, deleteCount: 1, insert: [newVal]});
		} else {
			this.updateDeep(curVal, newVal);
		}
	}, this);
	// add items at the end
	if(sourceArray.length > lastIndex) {
		addPatch(patches, {index: lastIndex+1, deleteCount: 0, insert: sourceArray.slice(lastIndex+1)});
	}
	for(var i = 0, patchLen = patches.length; i < patchLen; i++) {
		var patch = patches[i];
		getSetReflections.splice(target, patch.index, patch.deleteCount, patch.insert);
	}
	return target;
}

shapeReflections = {
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
	 * iterating over every key on `obj` and calling `callback` on each one.
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
		if(Array.isArray(list)) {
			return this.eachListLike(list, callback, context);
		} else {
			var iter, iterator = list[canSymbol.iterator];
			if(typeReflections.isIteratorLike(list)) {
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
				this.eachListLike(list, callback, context);
			}
		}
		return list;
	},
	eachListLike: function(list, callback, context){
		var index = -1;
		var length = list.length;
		if( length === undefined ) {
			var size = list[sizeSymbol];
			if(size) {
				length = size.call(list);
			} else {
				throw new Error("can-reflect: unable to iterate.");
			}
		}

		while (++index < length) {
			var item = list[index];
			if (callback.call(context || item, item, index, list) === false) {
				break;
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
		if(obj) {
			var enumerableKeys = this.getOwnEnumerableKeys(obj);

			// cache getKeyValue method if we can
			var getKeyValue = obj[getKeyValueSymbol] || shiftedGetKeyValue;

			return this.eachIndex(enumerableKeys, function(key){
				var value = getKeyValue.call(obj, key);
				return callback.call(context || obj, value, key, obj);
			});
		}
		return obj;
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
			return Object_Keys(obj);
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

	unwrap: makeSerializer("unwrap",[canSymbol.for("can.unwrap")]),
	serialize: makeSerializer("serialize",[canSymbol.for("can.serialize"), canSymbol.for("can.unwrap")]),

	assignMap: function(target, source) {
		// read each key and set it on target
		var hasOwnKey = fastHasOwnKey(target);
		var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
		var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
		this.eachKey(source,function(value, key){
			// if the target doesn't have this key or the keys are not the same
			if(!hasOwnKey(key) || getKeyValue.call(target, key) !==  value) {
				setKeyValue.call(target, key, value);
			}
		});
		return target;
	},
	assignList: function(target, source) {
		var inserting = this.toArray(source);
		getSetReflections.splice(target, 0, inserting, inserting );
		return target;
	},
	/**
	 * @function can-reflect/shape.assign assign
	 * @parent can-reflect/shape
	 * @description Assign one objects values to another
	 *
	 * @signature `.assign(target, source)`
	 *
	 * Copies the values (and properties if map-like) from `source` onto `target`.
	 *
	 * For map-like objects, every enumerable property on `target` is copied:
	 *
	 * ```js
	 * var target = {};
	 * var source = {key : "value"};
	 * var restult = canReflect.assign(target, source);
	 * result === target //-> true
	 * target //-> {key : "value"}
	 * ```
	 *
	 * For Arrays, enumerated values are copied over, but the length of the array will not be
	 * trunkated.  Use [can-reflect.update] for trunkating.
	 *
	 * ```js
	 * var target = ["a","b","c"];
	 * var source = ["A","B"];
	 * canReflect.assign(target, source);
	 * target //-> ["A","B","c"]
	 * ```
	 *
	 * @param  {Object} target The value that will be updated with `source`'s values.
	 * @param  {Object} source A source of values to copy to `target`.
	 * @return {Object} The target.
	 */
	assign: function(target, source) {
		if(typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source) ) {
			// copy to array and add these keys in place
			this.assignList(target, source);
		} else {
			this.assignMap(target, source);
		}
		return target;
	},
	assignDeepMap: function(target, source) {

		var hasOwnKey = fastHasOwnKey(target);
		var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
		var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;

		this.eachKey(source, function(newVal, key){
			if(!hasOwnKey(key)) {
				// set no matter what
				getSetReflections.setKeyValue(target, key, newVal);
			} else {
				var curVal = getKeyValue.call(target, key);

				// if either was primitive, no recursive update possible
				if(newVal === curVal) {
					// do nothing
				} else if(typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false ) {
					setKeyValue.call(target, key, newVal);
				} else {
					this.assignDeep(curVal, newVal);
				}
			}
		}, this);
		return target;
	},
	assignDeepList: function(target, source) {
		return updateDeepList.call(this,target, source, true);
	},
	/**
	 * @function can-reflect/shape.assignDeep assignDeep
	 * @parent can-reflect/shape
	 * @description Assign one objects values to another, and performs the same action for all child values.
	 *
	 * @signature `.assignDeep(target, source)`
	 *
	 * Copies the values (and properties if map-like) from `source` onto `target` and repeates for all child
	 * values.
	 *
	 * For map-like objects, every enumerable property on `target` is copied:
	 *
	 * ```js
	 * var target = {name: {first: "Justin"}};
	 * var source = {name: {last: "Meyer"}};
	 * var restult = canReflect.assignDeep(target, source);
	 * target //->  {name: {first: "Justin", last: "Meyer"}}
	 * ```
	 *
	 * An object can control the behavior of `assignDeep` using the [can-symbol/symbols/assignDeep] symbol.
	 *
	 * @param  {Object} target The value that will be updated with `source`'s values.
	 * @param  {Object} source A source of values to copy to `target`.
	 * @return {Object} The target.
	 */
	assignDeep: function(target, source){
		var assignDeep = target[canSymbol.for("can.assignDeep")];
		if(assignDeep) {
			assignDeep.call(target, source);
		} else if( typeReflections.isMoreListLikeThanMapLike(source) ) {
			// list-like
			this.assignDeepList(target, source);
		} else {
			// map-like
			this.assignDeepMap(target, source);
		}
		return target;
	},
	updateMap: function(target, source) {
		var sourceKeyMap = makeMap( this.getOwnEnumerableKeys(source) );

		var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
		var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;

		this.eachKey(target, function(curVal, key){
			if(!sourceKeyMap.get(key)) {
				getSetReflections.deleteKeyValue(target, key);
				return;
			}
			sourceKeyMap.set(key, false);
			var newVal = sourceGetKeyValue.call(source, key);

			// if either was primitive, no recursive update possible
			if(newVal !== curVal) {
				targetSetKeyValue.call(target, key, newVal);
			}
		}, this);

		this.eachIndex(sourceKeyMap.keys(), function(key){
			if(sourceKeyMap.get(key)) {
				targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key) );
			}
		})

		return target;
	},
	updateList: function(target, source) {
		var inserting = this.toArray(source);

		getSetReflections.splice(target, 0, target, inserting );
		return target;
	},
	/**
	 * @function can-reflect/shape.update update
	 * @parent can-reflect/shape
	 * @description Updates the values of an object match the values of an other object.
	 *
	 * @signature `.update(target, source)`
	 *
	 * Updates the values (and properties if map-like) of `target` to match the values of `source`. This does
	 * not recursively update.  For that, use [can-reflect/shape.updateDeep].
	 *
	 * For map-like objects, every enumerable property on `target` is copied:
	 *
	 * ```js
	 * var target = {name: {first: "Justin"}, age: 34};
	 * var source = {name: {last: "Meyer"}};
	 * var restult = canReflect.assignDeep(target, source);
	 * target //->  {name: {last: "Meyer"}}
	 * ```
	 *
	 * With Arrays all items of the source will be replaced with the new items.
	 *
	 * ```js
	 * var target = ["a","b","c"];
	 * var source = ["A","B"];
	 * canReflect.assign(target, source);
	 * target //-> ["A","B"]
	 * ```
	 *
	 * @param  {Object} target The value that will be updated with `source`'s values.
	 * @param  {Object} source A source of values to copy to `target`.
	 * @return {Object} The target.
	 */
	update: function(target, source) {
		if(typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source) ) {
			// copy to array and add these keys in place
			this.updateList(target, source);
		} else {
			this.updateMap(target, source);
		}
		return target;
	},
	updateDeepMap: function(target, source) {
		var sourceKeyMap = makeMap( this.getOwnEnumerableKeys(source) );

		var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
		var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;

		this.eachKey(target, function(curVal, key){

			if(!sourceKeyMap.get(key)) {
				getSetReflections.deleteKeyValue(target, key);
				return;
			}
			sourceKeyMap.set(key, false);
			var newVal = sourceGetKeyValue.call(source, key);

			// if either was primitive, no recursive update possible
			if(typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false ) {
				targetSetKeyValue.call(target, key, newVal);
			} else {
				this.updateDeep(curVal, newVal);
			}

		}, this);

		this.eachIndex(sourceKeyMap.keys(), function(key){
			if(sourceKeyMap.get(key)) {
				targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key) );
			}
		})
		return target;
	},
	updateDeepList: function(target, source) {
		return updateDeepList.call(this,target, source);
	},
	/**
	 * @function can-reflect/shape.updateDeep updateDeep
	 * @parent can-reflect/shape
	 * @description Makes the values of an object match the values of an other object including all children values.
	 *
	 * @signature `.updateDeep(target, source)`
	 *
	 * Updates the values (and properties if map-like) of `target` to match the values of `source`.
	 *
	 * For map-like objects, every enumerable property on `target` is copied:
	 *
	 * ```js
	 * var target = {name: {first: "Justin"}, age: 34};
	 * var source = {name: {last: "Meyer"}};
	 * var restult = canReflect.assignDeep(target, source);
	 * target //->  {name: {last: "Meyer"}}
	 * ```
	 *
	 * An object can control the behavior of `assignDeep` using the [can-symbol/symbols/updateDeep] symbol.
	 *
	 * For list-like objects, a diff and patch strategy is used.  This attempts to limit the number of changes.
	 *
	 * @param  {Object} target The value that will be updated with `source`'s values.
	 * @param  {Object} source A source of values to copy to `target`.
	 * @return {Object} The target.
	 */
	updateDeep: function(target, source){
		var updateDeep = target[canSymbol.for("can.updateDeep")];
		if(updateDeep) {
			updateDeep.call(target, source);
		} else if( typeReflections.isMoreListLikeThanMapLike(source) ) {
			// list-like
			this.updateDeepList(target, source);
		} else {
			// map-like
			this.updateDeepMap(target, source);
		}
		return target;
	},
	// walks up the whole property chain
	"in": function(){},
	getAllEnumerableKeys: function(){},
	getAllKeys: function(){},
	/**
	 * @function can-reflect/shape.assignSymbols assignSymbols
	 * @parent can-reflect/shape
	 * @description Assign well known symbols and values to an object.
	 *
	 * @signature `.assignSymbols(target, source)`
	 *
	 * Converts each property name on the `source` object to a [can-symbol.for well known symbol]
	 * and uses that symbol to set the corresponding value on target.
	 *
	 * This is used to easily set symbols correctly even when symbol isn't natively supported.
	 *
	 * ```js
	 * canReflect.assignSymbols(Map.prototype, {
	 *   "can.getKeyValue": Map.prototype.get
	 * })
	 * ```
	 *
	 * If a `source` property name matches a symbol on `Symbol` (like `iterator` on `Symbol.iterator`),
	 * that symbol will be used:
	 *
	 * ```js
	 * canReflect.assignSymbols(ArrayLike.prototype, {
	 *   "iterator": function() { ... }
	 * })
	 * ArrayLike.prototype[Symbol.iterator] = function(){ ... }
	 * ```
	 *
	 * @param  {Object} target The value that will be updated with `source`'s symbols and values.
	 * @param  {Object<name,value>} source A source of symbol names and values to copy to `target`.
	 * @return {Object} The target.
	 */
	assignSymbols: function(target, source){
		this.eachKey(source, function(value, key){
			var symbol = typeReflections.isSymbolLike(canSymbol[key]) ? canSymbol[key] : canSymbol.for(key);
			getSetReflections.setKeyValue(target, symbol, value);
		});
		return target;
	},
	isSerializable: isSerializable,
	/**
	 * @function can-reflect/shape.size size
	 * @parent can-reflect/shape
	 * @description Return the number of items in the collection.
	 *
	 * @signature `.size(target)`
	 *
	 * Returns the number of items contained in `target`. Target can
	 * provide the size using the [can-symbol/symbols/size] symbol.
	 *
	 * If the `target` has a numeric `length` property that is greater than or equal to 0, that
	 * `length` will be returned.
	 *
	 * ```js
	 * canReflect.size([1,2,3]) //-> 3
	 * ```
	 *
	 * If the `target` is [can-reflect.isListLike], the values of the list will be counted.
	 *
	 * If the `target` is a plain JS object, the number of enumerable properties will be returned.
	 *
	 * ```js
	 * canReflect.size({foo:"bar"}) //-> 1
	 * ```
	 *
	 * If the `target` is anything else, `undefined` is returned.
	 *
	 * @param  {Object} target The container object.
	 * @return {Number} The number of values in the target.
	 */
	size: function(obj){
		var size = obj[sizeSymbol];
		var count = 0;
		if(size) {
			return size.call(obj);
		}
		else if(helpers.hasLength(obj)){
			return obj.length
		}
		else if(typeReflections.isListLike(obj)){

			this.each(obj, function(){
				count++;
			});
			return count;
		}
		else if( obj ) {

			for(var prop in obj) {
				if(obj.hasOwnProperty(prop)) {
					count++;
				}
			}
			return count;
		}
		else {
			return undefined;
		}
	}
};
shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
module.exports = shapeReflections;
