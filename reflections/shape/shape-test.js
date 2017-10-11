var QUnit = require('steal-qunit');
var canSymbol = require('can-symbol');
var shapeReflections = require("./shape");
var getSetReflections = require("../get-set/get-set");
var testHelpers = require('../../can-reflect-test_helpers');

QUnit.module('can-reflect: shape reflections: own+enumerable');

function testModifiedMap(callback, symbolToMethod){
	symbolToMethod = symbolToMethod || {
		getOwnEnumerableKeys: "keys",
		hasOwnKey: "has",
		getKeyValue: "get"
	};

	if(testHelpers.mapSupported) {
		shapeReflections.eachKey(symbolToMethod, function(method, symbol){
			getSetReflections.setKeyValue(Map.prototype,canSymbol.for("can."+symbol),function(){
				return this[method].apply(this, arguments);
			});
		});

		callback();

		shapeReflections.eachKey(symbolToMethod, function(symbol){
			delete Map.prototype[canSymbol.for("can."+symbol)];
		});

	}
}


QUnit.test("getOwnEnumerableKeys (aka: keys)", function(){

	QUnit.deepEqual( shapeReflections.keys( {foo: 1, bar: 2}), ["foo","bar"], "POJO" );

	QUnit.deepEqual( shapeReflections.keys( ["0", "1"] ), Object.keys([1,2]), "Array"  );

	// Can we decorate a Map
	testModifiedMap(function(){
		var map = new Map(),
			obj = {};
		map.set("foo",1);
		map.set(obj, 2);

		QUnit.deepEqual( shapeReflections.toArray(shapeReflections.keys(map)),
			["foo",{}], "Decorated Map with can.getOwnEnumerableKeys" );
	});

	// Can we do the long form w/o the fast path
	var proto = {};
	getSetReflections.setKeyValue(proto,canSymbol.for("can.getOwnKeys"),function(){
		return ["a","b","c"];
	});
	getSetReflections.setKeyValue(proto,canSymbol.for("can.getOwnKeyDescriptor"),function(key){
		return ({
			a: {enumerable: false},
			b: {enumerable: true },
			c: {enumerable: true }
		})[key];
	});


	var defineMapLike = Object.create(proto,{});

	QUnit.deepEqual( shapeReflections.toArray(shapeReflections.keys(defineMapLike)),
		["b","c"], "Decorated Object with can.getOwnKeys and can.getOwnKeyDescriptor");

	/*var map = new Map(),
		obj = {};
	map.set("foo",1);
	map.set(obj, 2);

	QUnit.deepEqual( shapeReflections.toArray(shapeReflections.keys(map)),
		["foo",{}], "un-decorated Map" );*/
});

QUnit.test("eachIndex", function(){
	// Iterators work
	var Ctr = function(){};
	var arr = ["a", "b"];
	getSetReflections.setKeyValue(Ctr.prototype,canSymbol.iterator,function(){
		return {
			i: 0,
			next: function(){
				if(this.i === 1) {
					return { value: undefined, done: true };
				}
				this.i++;

				return { value: arr, done: false };
			}
		};
	});

	var obj = new Ctr();

	shapeReflections.eachIndex(obj, function(value, index){
		QUnit.equal(index, 0);
		QUnit.equal(value,arr);
	});

	shapeReflections.eachIndex(["a"], function(value, index){
		QUnit.equal(index, 0);
		QUnit.equal(value, "a");
	});

	function ArrayLike() {}
	ArrayLike.prototype = [];
	ArrayLike.prototype[canSymbol.iterator] = null;

	var noniterator = new ArrayLike();
	noniterator.push("a");
	shapeReflections.eachIndex(noniterator, function(value, index){
		QUnit.equal(index, 0);
		QUnit.equal(value,"a");
	});

});

QUnit.test("eachKey", function(){
	var index;
	var answers, map;
	// Defined on something

	testModifiedMap(function(){
		var o1 = {}, o2 = {};
		map = new Map([[o1, "1"], [o2, 2]]);
		index = 0;
		answers = [[o1, "1"], [o2, 2]];
		shapeReflections.eachKey(map, function(value, key){
			var answer = answers[index++];
			QUnit.equal(value, answer[1], "map value");
			QUnit.equal(key, answer[0], "map key");
		});
	});

	var obj = {a: "1", b: "2"};
	index = 0;
	answers = [["a", "1"], ["b", "2"]];
	shapeReflections.eachKey(obj, function(value, key){
		var answer = answers[index++];
		QUnit.equal(value, answer[1], "object value");
		QUnit.equal(key, answer[0], "object key");
	});


	/*
	map = new Map([[o1, "1"], [o2, 2]]);
	index = 0;
	answers = [[o1, "1"], [o2, 2]];
	shapeReflections.eachKey(map, function(value, key){
		var answer = answers[index++];
		QUnit.equal(value, answer[1], "plain map value");
		QUnit.equal(key, answer[0], "plain map key");
	});*/
});

QUnit.test("each", function(){
	shapeReflections.each({foo: "bar"}, function(value, key){
		QUnit.equal(key, "foo");
		QUnit.equal(value, "bar");
	});

	shapeReflections.each(["bar"], function(value, index){
		QUnit.equal(index, 0);
		QUnit.equal(value, "bar");
	});
});

QUnit.test("toArray", function(){
	if(typeof document !== "undefined") {
		var ul = document.createElement("ul");
		ul.innerHTML = "<li/><li/>";
		var arr = shapeReflections.toArray(ul.childNodes);

		QUnit.equal(arr.length, 2, "childNodes");
		QUnit.equal(arr[0].nodeName.toLowerCase(), "li", "childNodes");
	}
});


QUnit.module('can-reflect: shape reflections: own');

QUnit.test("hasOwnKey", function(){


	var map;
	// Defined on something

	testModifiedMap(function(){
		var o1 = {};
		map = new Map();
		map.set(o1, "1");
		QUnit.ok( shapeReflections.hasOwnKey(map, o1) , "Map" );
	});

	var obj = {foo: "bar"};

	QUnit.ok( shapeReflections.hasOwnKey(obj, "foo") , "obj" );
	QUnit.ok( !shapeReflections.hasOwnKey(obj, "bar") , "obj" );

});


QUnit.test("getOwnKeys", function(){
	var obj = Object.create(null,{
		foo: {value: "1", enumerable: true},
		bar: {value: "2", enumerable: false},
	});

	QUnit.deepEqual( shapeReflections.getOwnKeys(obj), ["foo","bar"] , "obj" );
});

QUnit.test("getOwnKeyDescriptor", function(){
	var obj = {foo: "bar"};

	QUnit.deepEqual(
		shapeReflections.getOwnKeyDescriptor(obj,"foo"),
		Object.getOwnPropertyDescriptor(obj, "foo") , "POJO" );

	var obj2 = {};
	getSetReflections.setKeyValue(obj2,canSymbol.for("can.getOwnKeyDescriptor"),function(key){
		return ({foo:{enumerable: true, type: "thing"}})[key];
	});
	QUnit.deepEqual(
		shapeReflections.getOwnKeyDescriptor(obj2,"foo"),
		{enumerable: true, type: "thing"}, "w/ symbol" );
});

QUnit.test("unwrap basics", function(){
	// tests something like
	//  compute(
	//    new Map({
	//      a: "A",
	//      list: new List([0,2])
	//    })
	//  )
	var list = {};

	getSetReflections.setKeyValue(list,canSymbol.iterator,function(){
		return {
			i: 0,
			next: function(){
				if(this.i === 3) {
					return { value: undefined, done: true };
				}
				this.i++;

				return { value: (this.i-1)*2, done: false };
			}
		};
	});
	getSetReflections.setKeyValue(list, canSymbol.for("can.isMoreListLikeThanMapLike"), true);

	var compute = {};
	getSetReflections.setKeyValue(compute,canSymbol.for("can.getValue"),function(){
		var map = {};

		getSetReflections.setKeyValue(map, canSymbol.for("can.getOwnEnumerableKeys"), function(){
			return ["a","b","c","list"];
		});

		getSetReflections.setKeyValue(map, canSymbol.for("can.getKeyValue"), function(key){
			return key === "list" ? list : key.toUpperCase();
		});
		return map;
	});
	var plain = shapeReflections.unwrap(compute);

	QUnit.deepEqual( plain, {
		a: "A",
		b: "B",
		c: "C",
		list: [0,2,4]
	});

});

QUnit.test("unwrap handles POJOs", function(){
	var a = {foo: "bar"};
	var plain = shapeReflections.unwrap(a);
	QUnit.deepEqual( plain, a);
	QUnit.ok( a !== plain , "returns copy");

});


if(typeof Map !== "undefined") {

	QUnit.test("handles cycles", function(){
		var a = {},
			b = {};

		a.b = b;
		b.a = a;
		var plain = shapeReflections.unwrap(a, Map);
		QUnit.equal(plain.b.a, plain, "cycle intact");
		QUnit.ok( a !== plain , "returns copy");
	});
}

QUnit.test("isBuiltIn is only called after decorators are checked in shouldSerialize", function() {
	var arr = [];
	QUnit.ok(shapeReflections.isSerializable(arr));
	arr[canSymbol.for('can.setKeyValue')] = function() {};
	QUnit.ok(!shapeReflections.isSerializable(arr));

	if (testHelpers.setSupported) {
		var set = new Set([{}, {}, {}]);
		QUnit.ok(shapeReflections.isSerializable(set));
		set[canSymbol.for("can.setKeyValue")] = function() {};
		QUnit.ok(!shapeReflections.isSerializable(set));
	}
});

QUnit.test(".serialize handles recursion with .unwrap", function(){



	// tests something like
	//  compute(
	//    new Map({
	//      a: "A",
	//      list: new List([0,2])
	//    })
	//  )
	var list = {};

	getSetReflections.setKeyValue(list,canSymbol.iterator,function(){
		return {
			i: 0,
			next: function(){
				if(this.i === 3) {
					return { value: undefined, done: true };
				}
				this.i++;

				return { value: (this.i-1)*2, done: false };
			}
		};
	});
	getSetReflections.setKeyValue(list, canSymbol.for("can.isMoreListLikeThanMapLike"), true);

	var compute = {};
	getSetReflections.setKeyValue(compute,canSymbol.for("can.getValue"),function(){
		var map = {};

		getSetReflections.setKeyValue(map, canSymbol.for("can.getOwnEnumerableKeys"), function(){
			return ["a","b","c","list"];
		});

		getSetReflections.setKeyValue(map, canSymbol.for("can.getKeyValue"), function(key){
			return key === "list" ? list : key.toUpperCase();
		});
		return map;
	});
	var plain = shapeReflections.unwrap(compute);

	QUnit.deepEqual( plain, {
		a: "A",
		b: "B",
		c: "C",
		list: [0,2,4]
	});

});

QUnit.test("updateDeep basics", function(){

	var obj = {
		name: "Justin",
		hobbies: [{id: 1, name: "js"},{id: 2, name: "foosball"}]
	};
	var hobbies = obj.hobbies;
	var js = obj.hobbies[0];

	shapeReflections.updateDeep(obj, {
		age: 34,
		hobbies: [{id: 1, name: "JS", fun: true}]
	});

	QUnit.deepEqual(obj, {
		age: 34,
		hobbies: [{id: 1, name: "JS", fun: true}]
	});
	QUnit.equal(obj.hobbies, hobbies, "merged hobbies");
	QUnit.equal(obj.hobbies[0], js, "merged js");


	shapeReflections.updateDeep(obj, {
		age: 34,
		hobbies: [{id: 1, name: "JS", fun: true},{id: 2, name: "foosball"}]
	});

	QUnit.deepEqual(obj, {
		age: 34,
		hobbies: [{id: 1, name: "JS", fun: true},{id: 2, name: "foosball"}]
	}, "added foosball");

	QUnit.equal(obj.hobbies, hobbies, "merged hobbies");
	QUnit.equal(obj.hobbies[0], js, "merged js");
});

QUnit.test("updateDeep", function(){
	var a = [];
	shapeReflections.updateDeep(a, ["a","b"]);

	QUnit.deepEqual(a, ["a","b"]);
});

QUnit.test("can assign undefined values", function(){
	var obj = shapeReflections.assignMap({}, {foo: undefined});
	QUnit.ok(obj.hasOwnProperty("foo"), "has an undefined foo");
});

QUnit.test("assignMap", function(){
	var target = shapeReflections.assignSymbols({},{
		"can.setKeyValue": function(key, value){
			this[key] = value * 2;
		},
		"can.getKeyValue": function(key) {
			return this[key] !== undefined ? this[key] / 2 : undefined;
		}
	});
	target.a = 22;
	var source = shapeReflections.assignSymbols({},{
		"can.setKeyValue": function(key, value){
			this[key] = value * 3;
		},
		"can.getKeyValue": function(key) {
			return this[key] !== undefined ? this[key] / 3 : undefined;
		}
	});

	shapeReflections.assignMap(source,{
		a: 1,
		b: 2
	});

	QUnit.deepEqual(source,{
		a: 3,
		b: 6
	}, "set values on source");

	shapeReflections.assignMap(target, source);

	QUnit.deepEqual(target,{
		a: 2,
		b: 4
	}, "set values on target");
});

QUnit.test("getOwnEnumerableKeys with primitives", function(){
	QUnit.deepEqual(shapeReflections.getOwnEnumerableKeys(1),[],"works with primitive");
});

if(typeof Symbol !== "undefined") {
	QUnit.test("assignSymbols can set Symbol.iterator", function(){
		var fn = function(){ };
		var obj = shapeReflections.assignSymbols({},{
			"iterator": fn
		});
		QUnit.equal(obj[Symbol.iterator], fn, "works");
	});
}


/*QUnit.module('can-reflect: shape reflections: proto chain');

QUnit.test("in", function(){

});

QUnit.test("getAllEnumerableKeys", function(){

});

QUnit.test("getAllKeys", function(){

});*/
