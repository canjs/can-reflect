var canSymbol = require("can-symbol");
var typeReflections = require("../type/type");

/**
 * @module can-reflect/call Call
 * @parent can-reflect
 *
 * @description  a set of functions that deal with callable objects. Generally these are functions, but other 
 * object types can implement these to make them callable with [can-reflect]
 */
module.exports = {
	/**
	 * @function {function(...), Object, ...} can-reflect/call.call call
	 * @parent can-reflect/call
	 * @description  Call a callable, with a context object and parameters
	 *
	 * @signature `call(func, context, ...rest)`
	 * @param  {function(...)} func the function to call with the supplied arguments
	 * @param  {Object} context the context object to set as `this` on the function call
	 * @param  {*} rest any arguments after `context` will be passed to the function call
	 * @return {*}  return types and values are determined by the call to `func`
	 */
	call: function(func, context){
		var args = [].slice.call(arguments, 2);
		var apply = func[canSymbol.for("can.apply")];
		if(apply) {
			return apply.call(func, context, args);
		} else {
			return func.apply(context, args);
		}
	},
	/**
	 * @function {function(...), Object, ...} can-reflect/call.apply apply
	 * @parent can-reflect/call
	 * @description  Call a callable, with a context object and a list of parameters
	 *
	 * @signature `apply(func, context, args)`
	 * @param  {function(...)} func the function to call
	 * @param  {Object} context the context object to set as `this` on the function call
	 * @param  {*} args arguments to be passed to the function call
	 * @return {*}  return types and values are determined by the call to `func`
	 */
	apply: function(func, context, args){
		var apply = func[canSymbol.for("can.apply")];
		if(apply) {
			return apply.call(func, context, args);
		} else {
			return func.apply(context, args);
		}
	},
	/**
	 * @function {function(...), ...} can-reflect/call.new new
	 * @parent can-reflect/call
	 * @description  Construct a new instance of a callable constructor 
	 *
	 * @signature `new(func, ...rest)`
	 * @param  {function(...)} func a constructor with a `prototype` and either a [can-symbol/symbols/new `@@can.new`]
	 * symbolic function or a function keyed on `apply`
	 * @param  {*} rest arguments to be passed to the constructor
	 * @return {Object}  if `func` returns an Object, that returned Object; otherwise a new instance of `func`
	 */
	"new": function(func){
		var args = [].slice.call(arguments, 1);
		var makeNew = func[canSymbol.for("can.new")];
		if(makeNew) {
			return makeNew.apply(func, args);
		} else {
			var context = Object.create(func.prototype);
			var ret = func.apply(context, args);
			if(typeReflections.isPrimitive(ret)) {
				return context;
			} else {
				return ret;
			}
		}
	}
};
