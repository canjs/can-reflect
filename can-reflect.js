var makeArray = require("can-util/js/make-array/make-array");

var functionReflections = require("./reflections/call/call");
var getSet = require("./reflections/get-set/get-set");
var observe = require("./reflections/observe/observe");
var shape = require("./reflections/shape/shape");
var type = require("./reflections/type/type");

var reflect = {};
[functionReflections,getSet,observe,shape,type].forEach(function(reflections){
	for(var prop in reflections) {
		reflect[prop] = reflections[prop];
	}
});

var hooks = {};
reflect.hook = function(key, newHooks) {
	var oldFunc;
	if(!hooks[key]) {
		hooks[key] = [];
		oldFunc = reflect[key];
		reflect[key] = function() {
			var args = arguments;
			hooks[key].forEach(function(hook) {
				hook.apply(this, args);
			});
			return oldFunc.apply(this, args);
		}
	}
	[].push.apply(hooks[key], makeArray(newHooks));
};

module.exports = reflect;
