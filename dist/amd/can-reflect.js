/*can-reflect@1.17.11#can-reflect*/
define([
    'require',
    'exports',
    'module',
    './reflections/call/call',
    './reflections/get-set/get-set',
    './reflections/observe/observe',
    './reflections/shape/shape',
    './reflections/shape/schema/schema',
    './reflections/type/type',
    './reflections/get-name/get-name',
    'can-namespace',
    './types/map',
    './types/set'
], function (require, exports, module) {
    'use strict';
    var functionReflections = require('./reflections/call/call');
    var getSet = require('./reflections/get-set/get-set');
    var observe = require('./reflections/observe/observe');
    var shape = require('./reflections/shape/shape');
    var schema = require('./reflections/shape/schema/schema');
    var type = require('./reflections/type/type');
    var getName = require('./reflections/get-name/get-name');
    var namespace = require('can-namespace');
    var reflect = {};
    [
        functionReflections,
        getSet,
        observe,
        shape,
        type,
        getName,
        schema
    ].forEach(function (reflections) {
        for (var prop in reflections) {
            reflect[prop] = reflections[prop];
        }
    });
    require('./types/map');
    require('./types/set');
    module.exports = namespace.Reflect = reflect;
});