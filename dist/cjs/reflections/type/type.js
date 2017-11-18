/*can-reflect@1.8.2#reflections/type/type*/
var canSymbol = require('can-symbol');
var helpers = require('../helpers.js');
var plainFunctionPrototypePropertyNames = Object.getOwnPropertyNames(function () {
}.prototype);
var plainFunctionPrototypeProto = Object.getPrototypeOf(function () {
}.prototype);
function isConstructorLike(func) {
    var value = func[canSymbol.for('can.new')];
    if (value !== undefined) {
        return value;
    }
    if (typeof func !== 'function') {
        return false;
    }
    var prototype = func.prototype;
    if (!prototype) {
        return false;
    }
    if (plainFunctionPrototypeProto !== Object.getPrototypeOf(prototype)) {
        return true;
    }
    var propertyNames = Object.getOwnPropertyNames(prototype);
    if (propertyNames.length === plainFunctionPrototypePropertyNames.length) {
        for (var i = 0, len = propertyNames.length; i < len; i++) {
            if (propertyNames[i] !== plainFunctionPrototypePropertyNames[i]) {
                return true;
            }
        }
        return false;
    } else {
        return true;
    }
}
var getNewOrApply = helpers.makeGetFirstSymbolValue([
    'can.new',
    'can.apply'
]);
function isFunctionLike(obj) {
    var result, symbolValue = obj[canSymbol.for('can.isFunctionLike')];
    if (symbolValue !== undefined) {
        return symbolValue;
    }
    result = getNewOrApply(obj);
    if (result !== undefined) {
        return !!result;
    }
    return typeof obj === 'function';
}
function isPrimitive(obj) {
    var type = typeof obj;
    if (obj == null || type !== 'function' && type !== 'object') {
        return true;
    } else {
        return false;
    }
}
function isBuiltIn(obj) {
    if (isPrimitive(obj) || Array.isArray(obj) || isPlainObject(obj) || Object.prototype.toString.call(obj) !== '[object Object]' && Object.prototype.toString.call(obj).indexOf('[object ') !== -1) {
        return true;
    } else {
        return false;
    }
}
function isValueLike(obj) {
    var symbolValue;
    if (isPrimitive(obj)) {
        return true;
    }
    symbolValue = obj[canSymbol.for('can.isValueLike')];
    if (typeof symbolValue !== 'undefined') {
        return symbolValue;
    }
    var value = obj[canSymbol.for('can.getValue')];
    if (value !== undefined) {
        return !!value;
    }
}
function isMapLike(obj) {
    if (isPrimitive(obj)) {
        return false;
    }
    var isMapLike = obj[canSymbol.for('can.isMapLike')];
    if (typeof isMapLike !== 'undefined') {
        return !!isMapLike;
    }
    var value = obj[canSymbol.for('can.getKeyValue')];
    if (value !== undefined) {
        return !!value;
    }
    return true;
}
var onValueSymbol = canSymbol.for('can.onValue'), onKeyValueSymbol = canSymbol.for('can.onKeyValue'), onPatchesSymbol = canSymbol.for('can.onPatches');
function isObservableLike(obj) {
    if (isPrimitive(obj)) {
        return false;
    }
    return Boolean(obj[onValueSymbol] || obj[onKeyValueSymbol] || obj[onPatchesSymbol]);
}
function isListLike(list) {
    var symbolValue, type = typeof list;
    if (type === 'string') {
        return true;
    }
    if (isPrimitive(list)) {
        return false;
    }
    symbolValue = list[canSymbol.for('can.isListLike')];
    if (typeof symbolValue !== 'undefined') {
        return symbolValue;
    }
    var value = list[canSymbol.iterator];
    if (value !== undefined) {
        return !!value;
    }
    if (Array.isArray(list)) {
        return true;
    }
    return helpers.hasLength(list);
}
var supportsSymbols = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
var isSymbolLike;
if (supportsSymbols) {
    isSymbolLike = function (symbol) {
        return typeof symbol === 'symbol';
    };
} else {
    var symbolStart = '@@symbol';
    isSymbolLike = function (symbol) {
        if (typeof symbol === 'object' && !Array.isArray(symbol)) {
            return symbol.toString().substr(0, symbolStart.length) === symbolStart;
        } else {
            return false;
        }
    };
}
var coreHasOwn = Object.prototype.hasOwnProperty;
var funcToString = Function.prototype.toString;
var objectCtorString = funcToString.call(Object);
function isPlainObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    var proto = Object.getPrototypeOf(obj);
    if (proto === Object.prototype || proto === null) {
        return true;
    }
    var Constructor = coreHasOwn.call(proto, 'constructor') && proto.constructor;
    return typeof Constructor === 'function' && Constructor instanceof Constructor && funcToString.call(Constructor) === objectCtorString;
}
module.exports = {
    isConstructorLike: isConstructorLike,
    isFunctionLike: isFunctionLike,
    isListLike: isListLike,
    isMapLike: isMapLike,
    isObservableLike: isObservableLike,
    isPrimitive: isPrimitive,
    isBuiltIn: isBuiltIn,
    isValueLike: isValueLike,
    isSymbolLike: isSymbolLike,
    isMoreListLikeThanMapLike: function (obj) {
        if (Array.isArray(obj)) {
            return true;
        }
        if (obj instanceof Array) {
            return true;
        }
        var value = obj[canSymbol.for('can.isMoreListLikeThanMapLike')];
        if (value !== undefined) {
            return value;
        }
        var isListLike = this.isListLike(obj), isMapLike = this.isMapLike(obj);
        if (isListLike && !isMapLike) {
            return true;
        } else if (!isListLike && isMapLike) {
            return false;
        }
    },
    isIteratorLike: function (obj) {
        return obj && typeof obj === 'object' && typeof obj.next === 'function' && obj.next.length === 0;
    },
    isPromise: function (obj) {
        return obj instanceof Promise || Object.prototype.toString.call(obj) === '[object Promise]';
    },
    isPlainObject: isPlainObject
};