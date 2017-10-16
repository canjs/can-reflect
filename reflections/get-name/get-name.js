var canSymbol = require("can-symbol");
var typeReflections = require("../type/type");

var getNameSymbol = canSymbol.for("can.getName");

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
function setName(obj, nameGetter) {
	if (typeof nameGetter !== "function") {
		var value = nameGetter;
		nameGetter = function() {
			return value;
		};
	}

	Object.defineProperty(obj, getNameSymbol, {
		value: nameGetter
	});
}

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
function getName(obj) {
	var nameGetter = obj[getNameSymbol];
	if (nameGetter) {
		return nameGetter.call(obj);
	}

	if (typeof obj === "function") {
		return obj.name; // + "()" // should we do this?
	}

	if (obj.constructor && obj !== obj.constructor) {
		var parent = getName(obj.constructor);
		if (parent) {
			if (typeReflections.isValueLike(obj)) {
				return parent + "<>";
			}

			if (typeReflections.isMoreListLikeThanMapLike(obj)) {
				return parent + "[]";
			}

			if (typeReflections.isMapLike(obj)) {
				return parent + "{}";
			}
		}
	}

	return undefined;
}

module.exports = {
	setName: setName,
	getName: getName
};
