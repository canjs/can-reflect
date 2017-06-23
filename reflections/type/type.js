var canSymbol = require("can-symbol");

var check = function(symbols, obj) {
	for(var i = 0, len = symbols.length ; i< len;i++) {
		var value = obj[canSymbol.for(symbols[i])];
		if(value !== undefined) {
			return value;
		}
	}
};
var plainFunctionPrototypePropertyNames = Object.getOwnPropertyNames((function(){}).prototype);

/**
 * @function can-reflect/type.isConstructorLike isConstructorLike
 * @parent can-reflect/type
 *
 * @signature `isConstructorLike(func)`
 *
 * Return `true` if `func` is a function and has a non-empty prototype, or implements
 *  [can-symbol/symbols/new `@@@@can.new`]; `false` otherwise.
 *
 * ```
 * canReflect.isConstructorLike(function() {}); // -> false
 *
 * function Construct() {}
 * Construct.prototype = { foo: "bar" };
 * canReflect.isConstructorLike(Construct); // -> true
 *
 * canReflect.isConstructorLike({}); // -> false
 * !!canReflect.isConstructorLike({ [canSymbol.for("can.new")]: function() {} }); // -> true
 * ```
 *
 * @param  {*}  func maybe a function
 * @return {Boolean}
 */
function isConstructorLike(func){
	/* jshint unused: false */
	// if you can new it ... it's a constructor
	var value = func[canSymbol.for("can.new")];
	if(value !== undefined) {
		return value;
	}

	if(typeof func !== "function") {
		return false;
	}
	// If there are any properties on the prototype that don't match
	// what is normally there, assume it's a constructor
	var propertyNames = Object.getOwnPropertyNames(func.prototype);
	if(propertyNames.length === plainFunctionPrototypePropertyNames.length) {
		for(var i = 0, len = propertyNames.length; i < len; i++) {
			if(propertyNames[i] !== plainFunctionPrototypePropertyNames[i]) {
				return true;
			}
		}
		return false;
	} else {
		return true;
	}
}

/**
 * @function can-reflect/type.isFunctionLike isFunctionLike
 * @parent can-reflect/type
 * @signature `isFunctionLike(obj)`
 *
 *  Return `true` if `func` is a function, or implements
 *  [can-symbol/symbols/new `@@@@can.new`] or [can-symbol/symbols/apply `@@@@can.apply`]; `false` otherwise.
 *
 * ```
 * canReflect.isFunctionLike(function() {}); // -> true
 * canReflect.isFunctionLike({}); // -> false
 * canReflect.isFunctionLike({ [canSymbol.for("can.apply")]: function() {} }); // -> true
 * ```
 *
 * @param  {*}  obj maybe a function
 * @return {Boolean}
 */
function isFunctionLike(obj){
	var result,
		symbolValue = obj[canSymbol.for("can.isFunctionLike")];

	if (symbolValue !== undefined) {
		return symbolValue;
	}

	result = check(["can.new","can.apply"], obj);
	if(result !== undefined) {
		return !!result;
	}

	return typeof obj === "function";
}

/**
 * @function can-reflect/type.isPrimitive isPrimitive
 * @parent can-reflect/type
 *
 * @signature `isPrimitive(obj)`
 *
 * Return `true` if `obj` is not a function nor an object via `typeof`, or is null; `false` otherwise.
 *
 * ```
 * canReflect.isPrimitive(null); // -> true
 * canReflect.isPrimitive({}); // -> false
 * canReflect.isPrimitive(undefined); // -> true
 * canReflect.isPrimitive(1); // -> true
 * canReflect.isPrimitive([]); // -> false
 * canReflect.isPrimitive(function() {}); // -> false
 * canReflect.isPrimitive("foo"); // -> true
 *
 * ```
 *
 * @param  {*}  obj maybe a primitive value
 * @return {Boolean}
 */
function isPrimitive(obj){
	var type = typeof obj;
	if(obj == null || (type !== "function" && type !== "object") ) {
		return true;
	} else {
		return false;
	}
}

/**
 * @function can-reflect/type.isValueLike isValueLike
 * @parent can-reflect/type
 *
 * @signature `isValueLike(obj)`
 *
 * Return `true` if `obj` is a primitive or implements [can-symbol/symbols/getValue `@@can.getValue`],
 * `false` otherwise.
 *
 * ```
 * canReflect.isValueLike(null); // -> true
 * canReflect.isValueLike({}); // -> false
 * canReflect.isValueLike(function() {}); // -> false
 * canReflect.isValueLike({ [canSymbol.for("can.isValueLike")]: true}); // -> true
 * canReflect.isValueLike({ [canSymbol.for("can.getValue")]: function() {} }); // -> true
 * canReflect.isValueLike(canCompute()); // -> true
 * canReflect.isValueLike(new DefineMap()); // -> false
 *
 * ```
 *
 * @param  {*}  obj maybe a primitive or an object that yields a value
 * @return {Boolean}
 */
function isValueLike(obj) {
	var symbolValue;
	if(isPrimitive(obj)) {
		return true;
	}
	symbolValue = obj[canSymbol.for("can.isValueLike")];
	if( typeof symbolValue !== "undefined") {
		return symbolValue;
	}
	var value = obj[canSymbol.for("can.getValue")];
	if(value !== undefined) {
		return !!value;
	}
}

/**
 * @function can-reflect/type.isMapLike isMapLike
 * @parent can-reflect/type
 *
 * @signature `isMapLike(obj)`
 *
 * Return `true` if `obj` is _not_ a primitive, does _not_ have a falsy value for
 * [can-symbol/symbols/isMapLike `@@@@can.isMapLike`], or alternately implements
 * [can-symbol/symbols/getKeyValue `@@@@can.getKeyValue`]; `false` otherwise.
 *
 * ```
 * canReflect.isMapLike(null); // -> false
 * canReflect.isMapLike(1); // -> false
 * canReflect.isMapLike("foo"); // -> false
 * canReflect.isMapLike({}); // -> true
 * canReflect.isMapLike(function() {}); // -> true
 * canReflect.isMapLike([]); // -> false
 * canReflect.isMapLike({ [canSymbol.for("can.isMapLike")]: false }); // -> false
 * canReflect.isMapLike({ [canSymbol.for("can.getKeyValue")]: null }); // -> false
 * canReflect.isMapLike(canCompute()); // -> false
 * canReflect.isMapLike(new DefineMap()); // -> true
 *
 * ```
 *
 * @param  {*}  obj maybe a Map-like
 * @return {Boolean}
 */
function isMapLike(obj) {
	if(isPrimitive(obj)) {
		return false;
	}
	var isMapLike = obj[canSymbol.for("can.isMapLike")];
	if(typeof isMapLike !== "undefined") {
		return !!isMapLike;
	}
	var value = obj[canSymbol.for("can.getKeyValue")];
	if(value !== undefined) {
		return !!value;
	}
	// everything else in JS is MapLike
	return true;
}

/**
 * @function can-reflect/type.isObservableLike isObservableLike
 * @parent can-reflect/type
 *
 * @signature `isObservableLike(obj)`
 *
 * Return  `true` if `obj` is _not_ a primitive and implements any of
 * [can-symbol/symbols/onValue `@@@@can.onValue`], [can-symbol/symbols/onKeyValue `@@@@can.onKeyValue`],
 * [can-symbol/symbols/onKeys `@@@@can.onKeys`],
 * or [can-symbol/symbols/onKeysAdded `@@@@can.onKeysAdded`]; `false` otherwise.
 *
 * ```
 * canReflect.isObservableLike(null); // -> false
 * canReflect.isObservableLike({}); // -> false
 * canReflect.isObservableLike([]); // -> false
 * canReflect.isObservableLike(function() {}); // -> false
 * canReflect.isObservableLike({ [canSymbol.for("can.onValue")]: function() {} }); // -> true
 * canReflect.isObservableLike({ [canSymbol.for("can.onKeyValue")]: function() {} }); // -> true
 * canReflect.isObservableLike(canCompute())); // -> true
 * canReflect.isObservableLike(new DefineMap())); // -> true
 * ```
 *
 * @param  {*}  obj maybe an observable
 * @return {Boolean}
 */
function isObservableLike( obj ) {
	if(isPrimitive(obj)) {
		return false;
	}
	var result = check(["can.onValue","can.onKeyValue","can.onKeys","can.onKeysAdded"], obj);
	if(result !== undefined) {
		return !!result;
	}
}

/**
 * @function can-reflect/type.isListLike isListLike
 * @parent can-reflect/type
 *
 * @signature `isListLike(list)`
 *
 * Return `true` if `list` is a `String`, <br>OR `list` is _not_ a primitive and implements `@@@@iterator`,
 * <br>OR `list` is _not_ a primitive and returns `true` for `Array.isArray()`, <br>OR `list` is _not_ a primitive and has a
 * numerical length and is either empty (`length === 0`) or has a last element at index `length - 1`; <br>`false` otherwise
 *
 * ```
 * canReflect.isListLike(null); // -> false
 * canReflect.isListLike({}); // -> false
 * canReflect.isListLike([]); // -> true
 * canReflect.isListLike("foo"); // -> true
 * canReflect.isListLike(1); // -> false
 * canReflect.isListLike({ [canSymbol.for("can.isListLike")]: true }); // -> true
 * canReflect.isListLike({ [canSymbol.iterator]: function() {} }); // -> true
 * canReflect.isListLike({ length: 0 }); // -> true
 * canReflect.isListLike({ length: 3 }); // -> false
 * canReflect.isListLike({ length: 3, "2": true }); // -> true
 * canReflect.isListLike(new DefineMap()); // -> false
 * canReflect.isListLike(new DefineList()); // -> true
 * ```
 *
 * @param  {*}  list maybe a List-like
 * @return {Boolean}
 */
function isListLike( list ) {
	var symbolValue,
		type = typeof list;
	if(type === "string") {
		return true;
	}
	if( isPrimitive(list) ) {
		return false;
	}
	symbolValue = list[canSymbol.for("can.isListLike")];
	if( typeof symbolValue !== "undefined") {
		return symbolValue;
	}
	var value = list[canSymbol.iterator];
	if(value !== undefined) {
		return !!value;
	}
	if(Array.isArray(list)) {
		return true;
	}

	// The `in` check is from jQuery’s fix for an iOS 8 64-bit JIT object length bug:
	// https://github.com/jquery/jquery/pull/2185
	var length = list && type !== 'boolean' &&
		typeof list !== 'number' &&
		"length" in list && list.length;

	// var length = "length" in obj && obj.length;
	return typeof list !== "function" &&
		( length === 0 || typeof length === "number" && length > 0 && ( length - 1 ) in list );
}

/**
 * @function can-reflect/type.isSymbolLike isSymbolLike
 * @parent can-reflect/type
 *
 * @signature `isSymbolLike(symbol)`
 *
 * Return `true` if `symbol` is a native Symbol, or evaluates to a String with a prefix
 * equal to that of CanJS's symbol polyfill; `false` otherwise.
 *
 * ```
 * /* ES6 *\/ canReflect.isSymbolLike(Symbol.iterator); // -> true
 * canReflect.isSymbolLike(canSymbol.for("foo")); // -> true
 * canReflect.isSymbolLike("@@symbol.can.isSymbol"); // -> true (due to polyfill for non-ES6)
 * canReflect.isSymbolLike("foo"); // -> false
 * canReflect.isSymbolLike(null); // -> false
 * canReflect.isSymbolLike(1); // -> false
 * canReflect.isSymbolLike({}); // -> false
 * canReflect.isSymbolLike({ toString: function() { return "@@symbol.can.isSymbol"; } }); // -> true
 * ```
 *
 * @param  {*}  symbol maybe a symbol
 * @return {Boolean}
 */
var symbolStart = "@@symbol";
function isSymbolLike( symbol ) {
	if(typeof symbol === "symbol") {
		return true;
	} else {
		return symbol.toString().substr(0, symbolStart.length) === symbolStart;
	}
}

/**
 * @module can-reflect/type Type
 * @parent can-reflect
 *
 * The `type` module deals with how to determine if a given object matches any of the familiar types to CanJS:
 * constructors, functions, lists, maps, observables (which are also lists and maps), primitives, values, and symbols.
 */
module.exports = {
	isConstructorLike: isConstructorLike,
	isFunctionLike: isFunctionLike,
	isListLike: isListLike,
	isMapLike: isMapLike,
	isObservableLike: isObservableLike,
	isPrimitive: isPrimitive,
	isValueLike: isValueLike,
	isSymbolLike: isSymbolLike,
	/**
	 * @function can-reflect/type.isMoreListLikeThanMapLike isMoreListLikeThanMapLike
	 * @parent can-reflect/type
	 *
	 * @signature `isMoreListLikeThanMapLike(obj)`
	 *
	 * Return  `true` if `obj` is an Array, declares itself to be more ListLike with
	 * `@@@@can.isMoreListLikeThanMapLike`, or self-reports as ListLike but not as MapLike; `false` otherwise.
	 *
	 * ```
	 * canReflect.isMoreListLikeThanMapLike([]); // -> true
	 * canReflect.isMoreListLikeThanMapLike(null); // -> undefined
	 * canReflect.isMoreListLikeThanMapLike({}); // -> false
	 * canReflect.isMoreListLikeThanMapLike(new DefineList()); // -> true
	 * canReflect.isMoreListLikeThanMapLike(new DefineMap()); // -> false
	 * canReflect.isMoreListLikeThanMapLike(function() {}); // -> false
	 * ```
	 *
	 * @param  {Object}  obj the object to test for ListLike against MapLike traits.
	 * @return {Boolean}
	 */
	isMoreListLikeThanMapLike: function(obj){
		if(Array.isArray(obj)) {
			return true;
		}
		var value = obj[canSymbol.for("can.isMoreListLikeThanMapLike")];
		if(value !== undefined) {
			return value;
		}
		var isListLike = this.isListLike(obj),
			isMapLike = this.isMapLike(obj);
		if(isListLike && !isMapLike) {
			return true;
		} else if(!isListLike && isMapLike) {
			return false;
		}
	},
	/**
	 * @function can-reflect/type.isIteratorLike isIteratorLike
	 * @parent can-reflect/type
	 *
	 * @signature `isIteratorLike(obj)`
	 *
	 * Return `true` if `obj` has a key `"next"` pointing to a zero-argument function; `false` otherwise
	 *
	 * ```
	 * canReflect.isIteratorLike([][Symbol.iterator]()); // -> true
	 * canReflect.isIteratorLike(new DefineList()[canSymbol.iterator]()); // -> true
	 * canReflect.isIteratorLike(new DefineMap()[canSymbol.iterator]()); // -> true
	 * canReflect.isIteratorLike(null); // -> false
	 * canReflect.isIteratorLike({ next: function() {} }); // -> true
	 * canReflect.isIteratorLike({ next: function(foo) {} }); // -> false (iterator nexts do not take arguments)
	 * ```
	 *
	 * @param  {Object}  obj the object to test for Iterator traits
	 * @return {Boolean}
	 */
	isIteratorLike: function(obj){
		return obj &&
			typeof obj === "object" &&
			typeof obj.next === "function" &&
			obj.next.length === 0;
	},
	isPromise: function(obj){
		return (obj instanceof Promise || (Object.prototype.toString.call(obj) === '[object Promise]'));
	}
};
