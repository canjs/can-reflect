var canSymbol = require("can-symbol");

var getNameSymbol = canSymbol.for("can.getName");

module.exports = {
	/**
	 * @function {Object, String} can-reflect.setName setName
	 * @parent can-reflect/shape
	 * @description Set a human-readable name of an object.
	 *
	 * @signature `setName(obj, value)`
	 *
	 * ```
	 * var f = function() {};
	 *
	 * canReflect.setName(f, "myFunction")
	 * f.name //-> "myFunction"
	 * ```
	 *
	 * @param {Object} obj   the object to set on
	 * @param {String} value the value to set for the object
	 */
	setName: function(obj, value) {
		Object.defineProperty(obj, "name", {
			value: value
		});
	},

	/**
	 * @function {Object} can-reflect.getName getName
	 * @parent can-reflect/shape
	 * @description Get the name of an object.
	 *
	 * @signature `getValue(obj)`
	 *
	 * ```
	 * var map = new DefineMap();
	 *
	 * canReflect.getName(map); //-> "DefineMap{}"
	 * ```
	 *
	 * @param  {Object} obj   the object to get from
	 * @return {String} The human-readable name of the object
	 */
	getName: function getName(obj) {
		if (typeof obj[getNameSymbol] === "function") {
			return obj[getNameSymbol]();
		} else {
			return (obj.constructor && obj.constructor.name) ?
				obj.constructor.name : "";
		}
	}
};
