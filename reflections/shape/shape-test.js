var QUnit = require('steal-qunit');
var canSymbol = require('can-symbol');
var shapeReflections = require("./shape");
var getSetReflections = require("../get-set/get-set");
var testHelpers = require('../../can-reflect-test_helpers');
require("./schema/schema-test");

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
	QUnit.ok(!shapeReflections.isSerialized(arr), "array is not isSerialized");
	QUnit.ok(!shapeReflections.isSerialized({}), "obj is not isSerialized");
	arr[canSymbol.for('can.setKeyValue')] = function() {};
	QUnit.ok(!shapeReflections.isSerialized(arr));

	if (testHelpers.setSupported) {
		var set = new Set([{}, {}, {}]);
		QUnit.ok(shapeReflections.isSerialized(set));
		set[canSymbol.for("can.setKeyValue")] = function() {};
		QUnit.ok(!shapeReflections.isSerialized(set));
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

QUnit.test(".serialize with recursive data structures", function(){
	var obj = {};
	obj.prop = obj;

	var s = shapeReflections.serialize(obj);
	QUnit.equal(s.prop, s, "Object points to itself");
});


QUnit.test("objects that serialize to strings should cache properly", function(){
	function SimpleType(){}
	getSetReflections.setKeyValue(SimpleType.prototype, canSymbol.for("can.serialize"), function(){
		return "baz";
	});
	var obj = new SimpleType();
	var p = {
		foo: obj, bar: obj
	};
	deepEqual(shapeReflections.serialize(p, window.Map), {foo:"baz", bar:"baz"});
});

QUnit.test("throw error when serializing circular reference", function(){
	function SimpleType(){}
	var a = new SimpleType();
	var b = new SimpleType();
	a.b = b;
	b.a = a;
	getSetReflections.setKeyValue(a, canSymbol.for("can.serialize"), function(){
		return {
			b: shapeReflections.serialize(this.b)
		};
	});
	getSetReflections.setKeyValue(b, canSymbol.for("can.serialize"), function(){
		return {
			a: shapeReflections.serialize(this.a)
		};
	});

	try{
		shapeReflections.serialize(a, window.Map);
		QUnit.ok(false);
	}catch(e){
		QUnit.ok(true);
	}
});

QUnit.test("throw should not when serializing circular reference properly", function(){
	function SimpleType(){}
	var a = new SimpleType();
	var b = new SimpleType();
	a.b = b;
	b.a = a;
	getSetReflections.setKeyValue(a, canSymbol.for("can.serialize"), function(proto){
		return proto.b = shapeReflections.serialize(this.b);
	});
	getSetReflections.setKeyValue(b, canSymbol.for("can.serialize"), function(proto){
		return proto.a = shapeReflections.serialize(this.a);
	});

	try{
		shapeReflections.serialize(a, window.Map);
		QUnit.ok(true);
	}catch(e){
		QUnit.ok(false);
	}
});

QUnit.test("Correctly serializes after throwing for circular reference", function(){
	function SimpleType(){}
	var a = new SimpleType();
	var b = new SimpleType();
	a.b = b;
	b.a = a;
	getSetReflections.setKeyValue(a, canSymbol.for("can.serialize"), function(){
		return {
			b: shapeReflections.serialize(this.b)
		};
	});
	getSetReflections.setKeyValue(b, canSymbol.for("can.serialize"), function(){
		return {
			a: shapeReflections.serialize(this.a)
		};
	});

	try{
		shapeReflections.serialize(a, window.Map);
		QUnit.ok(false);
	}catch(e){
		QUnit.ok(true);

		a = [1,2];
		shapeReflections.serialize(a, window.Map);

		b = a;
		b.shift();
		var s = shapeReflections.serialize(b, window.Map);
		QUnit.equal(s.length, 1, "there is one item");
		QUnit.equal(s[0], 2, "correct item");
	}
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


QUnit.test("defineInstanceKey with symbol on prototype", function() {
	var testKey = "foo";
	var testDef = { value: "bar" };

	function Foo() {}
	Foo.prototype[canSymbol.for("can.defineInstanceKey")] = function(key, definition) {
		QUnit.equal(key, testKey);
		QUnit.deepEqual(definition, testDef);
	};
	shapeReflections.defineInstanceKey(Foo, testKey, testDef);
});

QUnit.test("defineInstanceKey with no symbol on prototype", function() {
	var testKey = "foo";
	var testDef = { value: "bar" };
	var def;

	function Foo() {}
	shapeReflections.defineInstanceKey(Foo, testKey, testDef);

	QUnit.ok(def = Object.getOwnPropertyDescriptor(Foo.prototype, testKey), "Has descriptor");
	QUnit.equal(def.value, testDef.value, "Value is correctly set");
	QUnit.equal(def.configurable, true, "value is configurable");
	QUnit.equal(def.writable, true, "value is writable");

});

QUnit.test("updateDeep recurses correctly (#73)", function(){
	var source = {
		name: 'juan',
		hobbies: ['games', 'photography', 'building']
	},
		sourceArray = source.hobbies;
	shapeReflections.updateDeep(source, {hobbies: ['headdesk']});
	QUnit.deepEqual(source, {hobbies: ['headdesk']}, "source looks right");
	QUnit.equal(sourceArray, source.hobbies, "array updated");
});

QUnit.module('can-reflect: shape reflections: proto chain');

QUnit.test("hasKey", function() {
	var objHasKey = {};
	Object.defineProperty(objHasKey, "_keys", {
		value: { foo: true }
	});
	getSetReflections.setKeyValue(objHasKey, canSymbol.for("can.hasKey"), function(key) {
		return key in this._keys;
	});
	QUnit.ok(shapeReflections.hasKey(objHasKey, "foo") , "returns true when hasKey Symbol returns true");
	QUnit.ok(!shapeReflections.hasKey(objHasKey, "bar") , "returns false when hasKey Symbol returns false");

	var objHasOwnKey = {};
	Object.defineProperty(objHasOwnKey, "_keys", {
		value: { foo: true }
	});
	getSetReflections.setKeyValue(objHasOwnKey, canSymbol.for("can.hasOwnKey"), function(key) {
		return key in this._keys;
	});
	QUnit.ok(shapeReflections.hasKey(objHasOwnKey, "foo") , "returns true when hasOwnKey Symbol returns true");
	QUnit.ok(!shapeReflections.hasKey(objHasOwnKey, "bar") , "returns false when hasOwnKey Symbol returns false");

	objHasOwnKey.bar = "baz";
	QUnit.ok(shapeReflections.hasKey(objHasOwnKey, "bar") , "returns true when hasOwnKey Symbol returns false but `in` returns true");

	QUnit.ok(shapeReflections.hasKey(55, "toFixed") , "works on primitives");
	QUnit.ok(shapeReflections.hasKey(true, "valueOf") , "works on primitives");
	QUnit.ok(shapeReflections.hasKey('foo', "length") , "works on primitives");
	QUnit.notOk(shapeReflections.hasKey(null, "length") , "works on null");
	QUnit.notOk(shapeReflections.hasKey(undefined, "length") , "works on undefined");
});

QUnit.test("serialize clones", function(){
	var obj = {foo: {bar: "zed"}};

	var res = shapeReflections.serialize(obj);
	QUnit.deepEqual(res, obj, "look equal");
	QUnit.notOk(res === obj);
	QUnit.notOk(res.foo === obj.foo);
});

QUnit.test("serialize clones arrays", function(){
	var obj = {foo: [{zed: "ted"}]};
	var obj2 = shapeReflections.serialize(obj);
	QUnit.deepEqual(obj2, obj, "deep equal");

	QUnit.notOk(obj === obj2, "ret not the same");
	QUnit.notOk(obj.foo === obj2.foo, "foo not the same");
	QUnit.notOk(obj.foo[0] === obj2.foo[0]);
});

QUnit.test(".size", function(){
	QUnit.equal( shapeReflections.size([1]), 1, "array");
	QUnit.equal( shapeReflections.size([]), 0, "array");

	QUnit.equal( shapeReflections.size("a"), 1, "string");
	QUnit.equal( shapeReflections.size(""), 0, "array");

	QUnit.equal( shapeReflections.size({}), 0, "empty object");
	QUnit.equal( shapeReflections.size({foo:"bar"}), 1, "object");

	QUnit.equal( shapeReflections.size(null), 0, "null");
	QUnit.equal( shapeReflections.size(undefined), 0, "undefined");
});

QUnit.test("size works with out hasOwnProperty (#109)", function(){
	var obj = Object.create(null);
	QUnit.equal( shapeReflections.size(obj), 0, "empty object");
	obj.foo = "bar";
	QUnit.equal( shapeReflections.size(obj), 1, "has value");
});

QUnit.test("each loops without needing `this`", function(){
	var each = shapeReflections.each;

	each({}, function(){});
	QUnit.ok(true, "no error");
});

QUnit.test("assignDeepList", function(){
	var justin = {name: "Justin", age: 35},
		payal = {name: "Payal", age: 35};

	var people = [justin, payal];
	shapeReflections.assignDeep(people, [
		{age: 36}
	]);

	QUnit.deepEqual(people,  [
		{name: "Justin", age: 36},
		{name: "Payal", age: 35}
	], "assigned right");
});


/*QUnit.test("getAllEnumerableKeys", function(){

});

QUnit.test("getAllKeys", function(){

});*/
