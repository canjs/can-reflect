var QUnit = require("steal-qunit");
var canSymbol = require("can-symbol");
var reflexions = require("./identity");

var supportsFunctionName = (function name() {}).name === "name";

QUnit.module("can-reflect: getIdentity");

QUnit.test("it works with strings", function(assert) {
	var f = function() {};
	reflexions.setIdentity(f, "Christopher");
	assert.equal(reflexions.getIdentity(f), "Christopher");
});

QUnit.test("it works with functions", function(assert) {
	var f = function() {};
	reflexions.setIdentity(f, function() {
		return "Christopher";
	});
	assert.equal(reflexions.getIdentity(f), "Christopher");
});

QUnit.module("can-reflect: getName");

QUnit.test("it works with strings", function(assert) {
	var f = function() {};
	reflexions.setName(f, "Christopher");
	assert.equal(reflexions.getName(f), "Christopher");
});

QUnit.test("it works with functions", function(assert) {
	var f = function() {};
	reflexions.setName(f, function() {
		return "Christopher";
	});
	assert.equal(reflexions.getName(f), "Christopher");
});

if (supportsFunctionName) {
	QUnit.test("returns function name by default", function(assert) {
		assert.equal(
			reflexions.getName(function foo() {}),
			"foo",
			"should return function name"
		);
	});

	QUnit.test("returns empty string for anonymous functions", function(assert) {
		assert.equal(
			reflexions.getName(function() {}),
			"",
			"should return empty string"
		);
	});

	QUnit.test("returns constructor name by default", function(assert) {
		assert.equal(
			reflexions.getName({}),
			"Object{}",
			"should return constructor name"
		);
	});
}

QUnit.test("handles list-likes (with identity)", function(assert) {
	function ListThing(id) {
		this.id = id;
	}
	ListThing.prototype[canSymbol.for("can.isMoreListLikeThanMapLike")] = true;

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new ListThing()),
			"ListThing[]",
			"should use can.getName symbol behavior"
		);
	}

	reflexions.setIdentity(ListThing.prototype, function() {
		return this.id;
	});

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new ListThing(3)),
			"ListThing[3]",
			"should use can.getName symbol behavior with can.getIdentity"
		);
	}

	reflexions.setName(ListThing, "ListThing");

	assert.equal(
		reflexions.getName(new ListThing(3)),
		"ListThing[3]",
		"should use can.getName symbol behavior with can.getIdentity"
	);
});

QUnit.test("handles map-likes (with identity)", function(assert) {
	function MapThing(id) {
		this.id = id;
	}
	MapThing.prototype[canSymbol.for("can.isMapLike")] = true;

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new MapThing()),
			"MapThing{}",
			"should use can.getName symbol behavior"
		);
	}

	reflexions.setIdentity(MapThing.prototype, function() {
		return this.id;
	});

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new MapThing(3)),
			"MapThing{3}",
			"should use can.getName symbol behavior with can.getIdentity"
		);
	}

	reflexions.setName(MapThing, "MapThing");

	assert.equal(
		reflexions.getName(new MapThing(3)),
		"MapThing{3}",
		"should use can.getName symbol behavior with can.getIdentity"
	);
});

QUnit.test("handles value-likes (with identity)", function(assert) {
	function ValueThing(id) {
		this.id = id;
	}
	ValueThing.prototype[canSymbol.for("can.isValueLike")] = true;

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new ValueThing()),
			"ValueThing<>",
			"should use can.getName symbol behavior"
		);
	}

	reflexions.setIdentity(ValueThing.prototype, function() {
		return this.id;
	});

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName(new ValueThing(3)),
			"ValueThing<3>",
			"should use can.getName symbol behavior with can.getIdentity"
		);
	}

	reflexions.setName(ValueThing, "ValueThing");

	assert.equal(
		reflexions.getName(new ValueThing(3)),
		"ValueThing<3>",
		"should use can.getName symbol behavior with can.getIdentity"
	);
});
