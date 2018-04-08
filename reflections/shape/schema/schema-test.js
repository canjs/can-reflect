var QUnit = require('steal-qunit');
var canSymbol = require('can-symbol');
var schemaReflections = require("./schema");

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
