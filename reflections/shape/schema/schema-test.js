var QUnit = require('steal-qunit');
var canSymbol = require('can-symbol');
var schemaReflections = require("./schema");
var shapeReflections = require("../shape");

QUnit.module('can-reflect: shape reflections: schema');

var MyType = function(id){
    this._id = id;
    this.name = "nameValue";
};
MyType[canSymbol.for("can.getSchema")] = function(){
    return {
        identity: ["_id"]
    };
};

MyType.prototype.method = function(){};

QUnit.test("getSchema", function(){

    var schema = schemaReflections.getSchema(MyType);
    QUnit.deepEqual(schema, {
        identity: ["_id"]
    });

    var instance = new MyType("_id");
    schema = schemaReflections.getSchema(instance);
    QUnit.deepEqual(schema, {
        identity: ["_id"]
    });

});

QUnit.test('cloneKeySort', function (assert) {
    var obj = {
        "z": 0,
        "a": 0
    };

    var same = {
        "a": 0,
        "z": 0
    };

    assert.equal( JSON.stringify( schemaReflections.cloneKeySort(obj) ), JSON.stringify( same ) );
});

QUnit.test('cloneKeySort with strings', function (assert) {
    var obj = {
        "z": "0",
        "a": "0"
    };

    var same = {
        "a": "0",
        "z": "0"
    };

    assert.equal( JSON.stringify( schemaReflections.cloneKeySort(obj) ), JSON.stringify( same ) );
});

QUnit.test("getIdentity", function(){

    var value = new MyType(5);

    QUnit.equal( schemaReflections.getIdentity(value),  5, "used schema" );

    QUnit.equal(
        schemaReflections.getIdentity(value, {
            identity: ["_id","name"]
        }),
        '{"_id":5,"name":"nameValue"}');

});

QUnit.test("getSchema returns undefined when there is not schema", function(){

    QUnit.equal(schemaReflections.getSchema(function(){}), undefined, "is undefined");

});

QUnit.test("getSchema returns undefined when passed undefined", function(){

    QUnit.equal(schemaReflections.getSchema(undefined), undefined, "is undefined");

});

QUnit.test("canReflect.convert", function(){
    var res =  schemaReflections.convert("1", Number);
    QUnit.equal(typeof res, "number", "is right type");
    QUnit.equal(res, 1, "string -> number");
    QUnit.equal( schemaReflections.convert("Infinity", Number), Infinity, "string -> number");
    QUnit.equal( schemaReflections.convert(1, String), "1", "string");
    QUnit.equal( schemaReflections.convert(true, String), "true", "boolean -> string");
    QUnit.equal( schemaReflections.convert(false, String), "false", "boolean -> string");

    QUnit.equal( schemaReflections.convert("true", Boolean), true, "string true -> boolean");
    //QUnit.equal( schemaReflections.convert("false", Boolean), false, "string false -> boolean");
    //QUnit.equal( schemaReflections.convert("1", Boolean), false, "string 1 -> boolean false");

    // Basic constructor tests
    var MyConstructor = function(val){
        this.val = val;
    };
    MyConstructor.prototype.method = function(){};

    QUnit.equal( schemaReflections.convert("abc", MyConstructor).val, "abc", "creates new instance");

    var abc= new MyConstructor("abc");
    QUnit.equal( schemaReflections.convert(abc, MyConstructor), abc, "is instance");

    // MaybeString type
    var MaybeString = shapeReflections.assignSymbols({},{
        "can.new": function(val){
            if (val == null) {
                return val;
            }
            return '' + val;
        }
    });

    QUnit.equal( schemaReflections.convert("1", MaybeString), "1", "'1' -> MaybeString");
    QUnit.equal( schemaReflections.convert(null, MaybeString), null, "null -> MaybeString");

    // Convert symbol
    var toStringIsh = function(val){
        if (val == null) {
            return val;
        }
        return '' + val;
    };

    QUnit.equal( schemaReflections.convert("1", toStringIsh), "1", "'1' -> MaybeString");
    QUnit.equal( schemaReflections.convert(null, toStringIsh), null, "null -> MaybeString");
});
