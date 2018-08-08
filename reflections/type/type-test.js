var QUnit = require('steal-qunit');
var canSymbol = require('can-symbol');
var typeReflections = require("./type");
var getSetReflections = require("../get-set/get-set");
var testHelpers = require('../../can-reflect-test_helpers');

QUnit.module('can-reflect: type reflections');

QUnit.test("isConstructorLike", function(){
	var Constructor = function(){};
	Constructor.prototype.method = function(){};

	ok(typeReflections.isConstructorLike(Constructor));
	ok(!typeReflections.isConstructorLike(Constructor.prototype.method));

	var obj = {};
	getSetReflections.setKeyValue(obj,canSymbol.for("can.new"), function(){});


	ok(typeReflections.isConstructorLike(obj));

	ok(!typeReflections.isConstructorLike({}));
});

QUnit.test("isFunctionLike", function(){
	ok(!typeReflections.isFunctionLike({}), 'object is not function like');
	ok(typeReflections.isFunctionLike(function(){}), 'function is function like');

	var nonFunctionFunction = function() {};
	getSetReflections.setKeyValue(nonFunctionFunction, canSymbol.for("can.isFunctionLike"), false);
	ok(!typeReflections.isFunctionLike(nonFunctionFunction), 'function with can.isFunctionLike set to false is not function like');

	var obj = {};
	var func = function() {};
	getSetReflections.setKeyValue(obj, canSymbol.for("can.new"), func);
	getSetReflections.setKeyValue(obj, canSymbol.for("can.apply"), func);
	ok(typeReflections.isFunctionLike(obj), 'object with can.new and can.apply symbols is function like');

	getSetReflections.setKeyValue(obj, canSymbol.for("can.isFunctionLike"), false);
	ok(!typeReflections.isFunctionLike(obj), 'object with can.new, can.apply, and can.isFunctionLike set to false is not function like');

	equal(typeReflections.isFunctionLike(null), false, 'null is not a function');
	equal(typeReflections.isFunctionLike(undefined), false, 'undefined is not a function');
});

QUnit.test("isIteratorLike", function(){
	ok(!typeReflections.isIteratorLike({}));
	ok(typeReflections.isIteratorLike({next: function(){}}));
});

QUnit.test("isListLike", function(){
	ok(typeReflections.isListLike({0: 1, length: 1}));
	ok(typeReflections.isListLike("yes"), "string");
	ok(typeReflections.isListLike({
		length: 0
	}), "object with 0 length");
	var symboled = {};
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isListLike"), false);
	ok(!typeReflections.isListLike(symboled), "!@@can.isListLike");
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isListLike"), true);
	ok(typeReflections.isListLike(symboled), "@@can.isListLike");

	if(typeof document !== "undefined") {
		var ul = document.createElement("ul");
		ul.innerHTML = "<li/><li/>";
		ok(typeReflections.isListLike(ul.childNodes), "nodeList");
	}
	if(testHelpers.setSupported) {
		ok(typeReflections.isListLike(new Set()), "Set");
	}
});

QUnit.test("isMapLike", function(){
	ok(typeReflections.isMapLike({}), "Object");
	ok(typeReflections.isMapLike([]), "Array");
	var symboled = {};
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isMapLike"), false);
	ok(!typeReflections.isMapLike(symboled), "!@@can.isMapLike");
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isMapLike"), true);
	ok(typeReflections.isMapLike(symboled), "@@can.isMapLike");

	ok(!typeReflections.isMapLike("String"), "String");
});

QUnit.test("isMoreListLikeThanMapLike", function(){
	QUnit.equal(typeReflections.isMoreListLikeThanMapLike({}), false, "Object");
	QUnit.equal(typeReflections.isMoreListLikeThanMapLike([]), true, "Array");
	QUnit.equal(typeReflections.isMoreListLikeThanMapLike(null), false, "null");
	QUnit.equal(typeReflections.isMoreListLikeThanMapLike(undefined), false, "undefined");

});

QUnit.test("isObservableLike", function(){
	ok(typeReflections.isObservableLike({}) === false, "Object");
	ok(typeReflections.isObservableLike([]) === false, "Array");

	var obj = {};
	getSetReflections.setKeyValue(obj,canSymbol.for("can.onValue"), function(){});
	ok(typeReflections.isObservableLike(obj), "Object");
});

QUnit.test("isPrimitive", function(){
	ok(!typeReflections.isPrimitive({}), "Object");
	ok(typeReflections.isPrimitive(null), "null");
	ok(typeReflections.isPrimitive(1), "1");
});

QUnit.test("isBuiltIn", function() {
	ok(typeReflections.isBuiltIn(1), "Primitive");
	ok(typeReflections.isBuiltIn({}), "Object");
	ok(typeReflections.isBuiltIn([]), "Array");
	ok(typeReflections.isBuiltIn(function() {}), "Function");
	ok(typeReflections.isBuiltIn(new Date()), "Date");
	ok(typeReflections.isBuiltIn(/[foo].[bar]/), "RegEx");
	if (document) {
		ok(typeReflections.isBuiltIn(document.createElement('div')), "Elements");
	}
	var Foo = function() {}
	var customObj = new Foo();
	ok(!typeReflections.isBuiltIn(customObj), "Custom Object");
	if (testHelpers.mapSupported) {
		var map = new Map();
		ok(typeReflections.isBuiltIn(map), "Map");
	}
});

QUnit.test("isValueLike", function(){
	ok(!typeReflections.isValueLike({}), "Object");
	ok(!typeReflections.isValueLike(function(){}), "Function");
	ok(typeReflections.isValueLike("String"), "String");
	var obj = {};
	getSetReflections.setKeyValue(obj,canSymbol.for("can.getValue"), true);
	ok(typeReflections.isValueLike(obj), "symboled");
	var symboled = {};
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isValueLike"), false);
	ok(!typeReflections.isValueLike(symboled), "!@@can.isValueLike");
	getSetReflections.setKeyValue(symboled, canSymbol.for("can.isValueLike"), true);
	ok(typeReflections.isValueLike(symboled), "@@can.isValueLike");

});

QUnit.test("isSymbolLike", function(){
	if(typeof Symbol !== "undefined") {
		ok(typeReflections.isSymbolLike(Symbol("a symbol")), "Native Symbol");
	}

	ok(typeReflections.isSymbolLike(canSymbol("another Symbol")), "canSymbol Symbol");
});

QUnit.test("isPromise", function() {
	QUnit.ok(!typeReflections.isPromise({}), "Object is not a promise");
	QUnit.ok(!typeReflections.isPromise({ catch: function(){}, then: function(){} }), "function with then and catch is not a Promise");
	QUnit.ok(typeReflections.isPromise( new Promise(function(){})), "a new Promise() is a Promise");
});

QUnit.test("isConstructor - non enumerable properties on the prototype chain (#18)", function(){
	var Constructor = function(){

	};
	Object.defineProperty(Constructor.prototype, "prop", {
		enumerable: false,
		value: 1
	});

	QUnit.ok( typeReflections.isConstructorLike(Constructor), "decorated prototype means constructor");
});


QUnit.test("functions without prototypes (#20)", function(){
	var method = (function(){}).bind({});

	QUnit.notOk( typeReflections.isConstructorLike(method), "not a constructor");
});

QUnit.test("functions with deep non enumerable properties - non default proto chains (#22)", function(){
	var Base = function(){

	};
	Object.defineProperty(Base.prototype, "prop", {
		enumerable: false,
		value: 1
	});
	var Constructor = function(){};
	Constructor.prototype = new Base();
	Constructor.prototype.constructor = Constructor;

	QUnit.ok( typeReflections.isConstructorLike(Constructor), "decorated prototype means constructor");
});

QUnit.test("array -like type is MoreListLikeThanMapLike", function(){
	var MyArray = function(values) {
		this.push.apply(this, values || []);
	};
	MyArray.prototype = Object.create(Array.prototype);
	MyArray.prototype.constructor = MyArray;
	var arr = new MyArray();
	QUnit.ok(typeReflections.isMoreListLikeThanMapLike(arr), "is array like");
});
