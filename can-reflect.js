var functionReflections = require("./reflections/call/call");
var getSet = require("./reflections/get-set/get-set");
var observe = require("./reflections/observe/observe");
var shape = require("./reflections/shape/shape");
var type = require("./reflections/type/type");
var namespace = require("can-namespace");

var reflect = {};
[functionReflections,getSet,observe,shape,type].forEach(function(reflections){
	for(var prop in reflections) {
		reflect[prop] = reflections[prop];
	}
});

require("./types/map");
require("./types/set");

module.exports = namespace.Reflect = reflect;
