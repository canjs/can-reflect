var QUnit = require("steal-qunit");
var canSymbol = require("can-symbol");
var reflexions = require("./get-set-name");

QUnit.module("can-reflect: setName");

QUnit.test("it works", function(assert) {
	var f = function() {};
	reflexions.setName(f, "Person");
	assert.equal(f.name, "Person");
});

QUnit.module("can-reflect: getName");

QUnit.test("returns constructor name by default", function(assert) {
	var supportsFunctionName = !!Function.prototype.name;

	if (supportsFunctionName) {
		assert.equal(
			reflexions.getName({}),
			"Object",
			"should return constructor name"
		);
	} else {
		assert.expect(0);
	}
});

QUnit.test("returns empty string when constructor missing", function(assert) {
	assert.equal(
		reflexions.getName(Object.create(null)),
		"",
		"should return empty string"
	);
});

QUnit.test("calls can.getName symbol if implemented", function(assert) {
	var a = function() {};
	var getNameSymbol = canSymbol.for("can.getName");

	a[getNameSymbol] = function() {
		return "foo";
	};

	assert.equal(
		reflexions.getName(a),
		"foo",
		"should use can.getName symbol behavior"
	);
});
