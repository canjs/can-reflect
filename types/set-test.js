var QUnit = require("steal-qunit");
var shape = require("../reflections/shape/shape");
var type = require("../reflections/type/type");
require("./set");

function assertSetMatchesArray(set, array, msg) {
	QUnit.equal(set.size, array.length, msg + " - size matches");

	for (var i=0; i<array.length; i++) {
		QUnit.ok(set.has(array[i]), msg + " - set contains " + array[i]);
	}
}

if(typeof Set !== "undefined") {
    QUnit.module("can-reflect/types/set Set");

    QUnit.test("isListLike", function(){
        QUnit.ok( type.isListLike(new Set()), "isListLike" );
        QUnit.ok( type.isMoreListLikeThanMapLike(new Set()), "isMoreListLikeThanMapLike" );

    });

    QUnit.test("shape.each", function(){
        var arr = ["a","b"];
        var set = new Set();
        arr.forEach(function(val) {
          set.add(val);
        });

        var count = 0;
        shape.each(set, function(value){
            QUnit.equal(value, arr[count++], "got the right values back");
        });
    });

    QUnit.test("shape.update", function(){
        var set = new Set(["a","b"]);

        shape.update(set, ["a","a","c"]);

        assertSetMatchesArray(set, [ "a", "c" ], ".update");
    });

    QUnit.test("shape.assign", function(){
        var arr = ["a","b"];
        var set = new Set();
        arr.forEach(function(val) {
          set.add(val);
        });

        shape.assign(set, ["a","a","c"]);

        assertSetMatchesArray(set, [ "a", "b", "c" ], ".assign");
    });
}

if(typeof WeakSet !== "undefined") {
    QUnit.module("can-reflect/types/set WeakSet");

    QUnit.test("isListLike", function(){
        QUnit.ok( type.isListLike(new WeakSet()), "isListLike" );
        QUnit.ok( type.isMoreListLikeThanMapLike(new WeakSet()), "isMoreListLikeThanMapLike" );

    });

    QUnit.test("shape.each", function(){
        var arr = [{},{}];
        var set = new WeakSet(arr);

        try {
            shape.each(set, function(){});
        } catch(e) {
            QUnit.ok(true, "Error "+e.message);
        }

    });

    QUnit.test("shape.update", function(){
        var a = {}, b = {}, c = {};
        var set = new WeakSet([a, b]);
        try {
            shape.update(set, [a,a, c]);
        } catch(e) {
            QUnit.ok(true, "Error "+e.message);
        }
    });

    QUnit.test("shape.assign", function(){
        var a = {}, b = {}, c = {};
        var set = new WeakSet([a,b]);

        shape.assign(set, [a,a,c]);

        // should have everything
        QUnit.ok(set.has(a));
        QUnit.ok(set.has(b));
        QUnit.ok(set.has(c));

    });
}
