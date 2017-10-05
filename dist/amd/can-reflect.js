/*can-reflect@1.4.4#can-reflect*/
define([
    'require',
    'exports',
    'module',
    './reflections/call/call',
    './reflections/get-set/get-set',
    './reflections/observe/observe',
    './reflections/shape/shape',
    './reflections/type/type',
    'can-namespace',
    './types/map',
    './types/set'
], function (require, exports, module) {
    var functionReflections = require('./reflections/call/call');
    var getSet = require('./reflections/get-set/get-set');
    var observe = require('./reflections/observe/observe');
    var shape = require('./reflections/shape/shape');
    var type = require('./reflections/type/type');
    var namespace = require('can-namespace');
    var reflect = {};
    [
        functionReflections,
        getSet,
        observe,
        shape,
        type
    ].forEach(function (reflections) {
        for (var prop in reflections) {
            reflect[prop] = reflections[prop];
        }
    });
    require('./types/map');
    require('./types/set');
    module.exports = namespace.Reflect = reflect;
});