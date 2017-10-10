var functionReflections = require("./reflections/call/call");
var getSet = require("./reflections/get-set/get-set");
var observe = require("./reflections/observe/observe");
var shape = require("./reflections/shape/shape");
var type = require("./reflections/type/type");
var getSetName = require("./reflections/get-set-name/get-set-name");
var namespace = require("can-namespace");

var reflect = {};
[
	functionReflections,
	getSet,
	observe,
	shape,
	type,
	getSetName
].forEach(function(reflections){
	for(var prop in reflections) {
		reflect[prop] = reflections[prop];
		//!steal-remove-start
		if(typeof reflections[prop] === "function") {
			Object.defineProperty(reflections[prop],"name",{
				value: "canReflect."+prop
			});
		}
		//!steal-remove-end
	}
});

require("./types/map");
require("./types/set");

module.exports = namespace.Reflect = reflect;
