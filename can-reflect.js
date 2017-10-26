var functionReflections = require("./reflections/call/call");
var getSet = require("./reflections/get-set/get-set");
var observe = require("./reflections/observe/observe");
var shape = require("./reflections/shape/shape");
var type = require("./reflections/type/type");
var getName = require("./reflections/get-name/get-name");
var namespace = require("can-namespace");

//!steal-remove-start
var supportsWritingFunctionNames = false;
try { 
	debugger;
	var featureFunc = function() {};
	Object.defineProperty(featureFunc, "name", { value: 'test' });
	supportsWritingFunctionNames = true;
} catch(e) {
	console.log(e.message);
}
//!steal-remove-end

var reflect = {};
[
	functionReflections,
	getSet,
	observe,
	shape,
	type,
	getName
].forEach(function(reflections){
	for(var prop in reflections) {
		reflect[prop] = reflections[prop];
		//!steal-remove-start
		if(supportsWritingFunctionNames && typeof reflections[prop] === "function") {
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
