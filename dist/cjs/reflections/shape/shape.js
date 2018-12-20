/*can-reflect@1.17.8#reflections/shape/shape*/
'use strict';
var canSymbol = require('can-symbol');
var getSetReflections = require('../get-set/get-set.js');
var typeReflections = require('../type/type.js');
var helpers = require('../helpers.js');
var getPrototypeOfWorksWithPrimitives = true;
try {
    Object.getPrototypeOf(1);
} catch (e) {
    getPrototypeOfWorksWithPrimitives = false;
}
var ArrayMap;
if (typeof Map === 'function') {
    ArrayMap = Map;
} else {
    var isEven = function isEven(num) {
        return num % 2 === 0;
    };
    ArrayMap = function () {
        this.contents = [];
    };
    ArrayMap.prototype = {
        _getIndex: function (key) {
            var idx;
            do {
                idx = this.contents.indexOf(key, idx);
            } while (idx !== -1 && !isEven(idx));
            return idx;
        },
        has: function (key) {
            return this._getIndex(key) !== -1;
        },
        get: function (key) {
            var idx = this._getIndex(key);
            if (idx !== -1) {
                return this.contents[idx + 1];
            }
        },
        set: function (key, value) {
            var idx = this._getIndex(key);
            if (idx !== -1) {
                this.contents[idx + 1] = value;
            } else {
                this.contents.push(key);
                this.contents.push(value);
            }
        },
        'delete': function (key) {
            var idx = this._getIndex(key);
            if (idx !== -1) {
                this.contents.splice(idx, 2);
            }
        }
    };
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
var shapeReflections;
var shiftFirstArgumentToThis = function (func) {
    return function () {
        var args = [this];
        args.push.apply(args, arguments);
        return func.apply(null, args);
    };
};
var getKeyValueSymbol = canSymbol.for('can.getKeyValue');
var shiftedGetKeyValue = shiftFirstArgumentToThis(getSetReflections.getKeyValue);
var setKeyValueSymbol = canSymbol.for('can.setKeyValue');
var shiftedSetKeyValue = shiftFirstArgumentToThis(getSetReflections.setKeyValue);
var sizeSymbol = canSymbol.for('can.size');
var hasUpdateSymbol = helpers.makeGetFirstSymbolValue([
    'can.updateDeep',
    'can.assignDeep',
    'can.setKeyValue'
]);
var shouldUpdateOrAssign = function (obj) {
    return typeReflections.isPlainObject(obj) || Array.isArray(obj) || !!hasUpdateSymbol(obj);
};
function isSerializedHelper(obj) {
    if (typeReflections.isPrimitive(obj)) {
        return true;
    }
    if (hasUpdateSymbol(obj)) {
        return false;
    }
    return typeReflections.isBuiltIn(obj) && !typeReflections.isPlainObject(obj) && !Array.isArray(obj);
}
var Object_Keys;
try {
    Object.keys(1);
    Object_Keys = Object.keys;
} catch (e) {
    Object_Keys = function (obj) {
        if (typeReflections.isPrimitive(obj)) {
            return [];
        } else {
            return Object.keys(obj);
        }
    };
}
function createSerializeMap(Type) {
    var MapType = Type || ArrayMap;
    return {
        unwrap: new MapType(),
        serialize: new MapType(),
        isSerializing: {
            unwrap: new MapType(),
            serialize: new MapType()
        },
        circularReferenceIsSerializing: {
            unwrap: new MapType(),
            serialize: new MapType()
        }
    };
}
function makeSerializer(methodName, symbolsToCheck) {
    var serializeMap = null;
    function SerializeOperation(MapType) {
        this.first = !serializeMap;
        if (this.first) {
            serializeMap = createSerializeMap(MapType);
        }
        this.map = serializeMap;
        this.result = null;
    }
    SerializeOperation.prototype.end = function () {
        if (this.first) {
            serializeMap = null;
        }
        return this.result;
    };
    return function serializer(value, MapType) {
        if (isSerializedHelper(value)) {
            return value;
        }
        var operation = new SerializeOperation(MapType);
        if (typeReflections.isValueLike(value)) {
            operation.result = this[methodName](getSetReflections.getValue(value));
        } else {
            var isListLike = typeReflections.isIteratorLike(value) || typeReflections.isMoreListLikeThanMapLike(value);
            operation.result = isListLike ? [] : {};
            if (operation.map[methodName].has(value)) {
                if (operation.map.isSerializing[methodName].has(value)) {
                    operation.map.circularReferenceIsSerializing[methodName].set(value, true);
                }
                return operation.map[methodName].get(value);
            } else {
                operation.map[methodName].set(value, operation.result);
            }
            for (var i = 0, len = symbolsToCheck.length; i < len; i++) {
                var serializer = value[symbolsToCheck[i]];
                if (serializer) {
                    operation.map.isSerializing[methodName].set(value, true);
                    var oldResult = operation.result;
                    operation.result = serializer.call(value, oldResult);
                    operation.map.isSerializing[methodName].delete(value);
                    if (operation.result !== oldResult) {
                        if (operation.map.circularReferenceIsSerializing[methodName].has(value)) {
                            operation.end();
                            throw new Error('Cannot serialize cirular reference!');
                        }
                        operation.map[methodName].set(value, operation.result);
                    }
                    return operation.end();
                }
            }
            if (typeof obj === 'function') {
                operation.map[methodName].set(value, value);
                operation.result = value;
            } else if (isListLike) {
                this.eachIndex(value, function (childValue, index) {
                    operation.result[index] = this[methodName](childValue);
                }, this);
            } else {
                this.eachKey(value, function (childValue, prop) {
                    operation.result[prop] = this[methodName](childValue);
                }, this);
            }
        }
        return operation.end();
    };
}
var makeMap;
if (typeof Map !== 'undefined') {
    makeMap = function (keys) {
        var map = new Map();
        shapeReflections.eachIndex(keys, function (key) {
            map.set(key, true);
        });
        return map;
    };
} else {
    makeMap = function (keys) {
        var map = {};
        keys.forEach(function (key) {
            map[key] = true;
        });
        return {
            get: function (key) {
                return map[key];
            },
            set: function (key, value) {
                map[key] = value;
            },
            keys: function () {
                return keys;
            }
        };
    };
}
var fastHasOwnKey = function (obj) {
    var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
    if (hasOwnKey) {
        return hasOwnKey.bind(obj);
    } else {
        var map = makeMap(shapeReflections.getOwnEnumerableKeys(obj));
        return function (key) {
            return map.get(key);
        };
    }
};
function addPatch(patches, patch) {
    var lastPatch = patches[patches.length - 1];
    if (lastPatch) {
        if (lastPatch.deleteCount === lastPatch.insert.length && patch.index - lastPatch.index === lastPatch.deleteCount) {
            lastPatch.insert.push.apply(lastPatch.insert, patch.insert);
            lastPatch.deleteCount += patch.deleteCount;
            return;
        }
    }
    patches.push(patch);
}
function updateDeepList(target, source, isAssign) {
    var sourceArray = this.toArray(source);
    var patches = [], lastIndex = -1;
    this.eachIndex(target, function (curVal, index) {
        lastIndex = index;
        if (index >= sourceArray.length) {
            if (!isAssign) {
                addPatch(patches, {
                    index: index,
                    deleteCount: target.length - index + 1,
                    insert: []
                });
            }
            return false;
        }
        var newVal = sourceArray[index];
        if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
            addPatch(patches, {
                index: index,
                deleteCount: 1,
                insert: [newVal]
            });
        } else {
            if (isAssign === true) {
                this.assignDeep(curVal, newVal);
            } else {
                this.updateDeep(curVal, newVal);
            }
        }
    }, this);
    if (sourceArray.length > lastIndex) {
        addPatch(patches, {
            index: lastIndex + 1,
            deleteCount: 0,
            insert: sourceArray.slice(lastIndex + 1)
        });
    }
    for (var i = 0, patchLen = patches.length; i < patchLen; i++) {
        var patch = patches[i];
        getSetReflections.splice(target, patch.index, patch.deleteCount, patch.insert);
    }
    return target;
}
shapeReflections = {
    each: function (obj, callback, context) {
        if (typeReflections.isIteratorLike(obj) || typeReflections.isMoreListLikeThanMapLike(obj)) {
            return shapeReflections.eachIndex(obj, callback, context);
        } else {
            return shapeReflections.eachKey(obj, callback, context);
        }
    },
    eachIndex: function (list, callback, context) {
        if (Array.isArray(list)) {
            return shapeReflections.eachListLike(list, callback, context);
        } else {
            var iter, iterator = list[canSymbol.iterator];
            if (typeReflections.isIteratorLike(list)) {
                iter = list;
            } else if (iterator) {
                iter = iterator.call(list);
            }
            if (iter) {
                var res, index = 0;
                while (!(res = iter.next()).done) {
                    if (callback.call(context || list, res.value, index++, list) === false) {
                        break;
                    }
                }
            } else {
                shapeReflections.eachListLike(list, callback, context);
            }
        }
        return list;
    },
    eachListLike: function (list, callback, context) {
        var index = -1;
        var length = list.length;
        if (length === undefined) {
            var size = list[sizeSymbol];
            if (size) {
                length = size.call(list);
            } else {
                throw new Error('can-reflect: unable to iterate.');
            }
        }
        while (++index < length) {
            var item = list[index];
            if (callback.call(context || item, item, index, list) === false) {
                break;
            }
        }
        return list;
    },
    toArray: function (obj) {
        var arr = [];
        shapeReflections.each(obj, function (value) {
            arr.push(value);
        });
        return arr;
    },
    eachKey: function (obj, callback, context) {
        if (obj) {
            var enumerableKeys = shapeReflections.getOwnEnumerableKeys(obj);
            var getKeyValue = obj[getKeyValueSymbol] || shiftedGetKeyValue;
            return shapeReflections.eachIndex(enumerableKeys, function (key) {
                var value = getKeyValue.call(obj, key);
                return callback.call(context || obj, value, key, obj);
            });
        }
        return obj;
    },
    'hasOwnKey': function (obj, key) {
        var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
        if (hasOwnKey) {
            return hasOwnKey.call(obj, key);
        }
        var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
        if (getOwnKeys) {
            var found = false;
            shapeReflections.eachIndex(getOwnKeys.call(obj), function (objKey) {
                if (objKey === key) {
                    found = true;
                    return false;
                }
            });
            return found;
        }
        return hasOwnProperty.call(obj, key);
    },
    getOwnEnumerableKeys: function (obj) {
        var getOwnEnumerableKeys = obj[canSymbol.for('can.getOwnEnumerableKeys')];
        if (getOwnEnumerableKeys) {
            return getOwnEnumerableKeys.call(obj);
        }
        if (obj[canSymbol.for('can.getOwnKeys')] && obj[canSymbol.for('can.getOwnKeyDescriptor')]) {
            var keys = [];
            shapeReflections.eachIndex(shapeReflections.getOwnKeys(obj), function (key) {
                var descriptor = shapeReflections.getOwnKeyDescriptor(obj, key);
                if (descriptor.enumerable) {
                    keys.push(key);
                }
            }, this);
            return keys;
        } else {
            return Object_Keys(obj);
        }
    },
    getOwnKeys: function (obj) {
        var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
        if (getOwnKeys) {
            return getOwnKeys.call(obj);
        } else {
            return Object.getOwnPropertyNames(obj);
        }
    },
    getOwnKeyDescriptor: function (obj, key) {
        var getOwnKeyDescriptor = obj[canSymbol.for('can.getOwnKeyDescriptor')];
        if (getOwnKeyDescriptor) {
            return getOwnKeyDescriptor.call(obj, key);
        } else {
            return Object.getOwnPropertyDescriptor(obj, key);
        }
    },
    unwrap: makeSerializer('unwrap', [canSymbol.for('can.unwrap')]),
    serialize: makeSerializer('serialize', [
        canSymbol.for('can.serialize'),
        canSymbol.for('can.unwrap')
    ]),
    assignMap: function (target, source) {
        var hasOwnKey = fastHasOwnKey(target);
        var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
        var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
        shapeReflections.eachKey(source, function (value, key) {
            if (!hasOwnKey(key) || getKeyValue.call(target, key) !== value) {
                setKeyValue.call(target, key, value);
            }
        });
        return target;
    },
    assignList: function (target, source) {
        var inserting = shapeReflections.toArray(source);
        getSetReflections.splice(target, 0, inserting, inserting);
        return target;
    },
    assign: function (target, source) {
        if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
            shapeReflections.assignList(target, source);
        } else {
            shapeReflections.assignMap(target, source);
        }
        return target;
    },
    assignDeepMap: function (target, source) {
        var hasOwnKey = fastHasOwnKey(target);
        var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
        var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
        shapeReflections.eachKey(source, function (newVal, key) {
            if (!hasOwnKey(key)) {
                getSetReflections.setKeyValue(target, key, newVal);
            } else {
                var curVal = getKeyValue.call(target, key);
                if (newVal === curVal) {
                } else if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                    setKeyValue.call(target, key, newVal);
                } else {
                    shapeReflections.assignDeep(curVal, newVal);
                }
            }
        }, this);
        return target;
    },
    assignDeepList: function (target, source) {
        return updateDeepList.call(this, target, source, true);
    },
    assignDeep: function (target, source) {
        var assignDeep = target[canSymbol.for('can.assignDeep')];
        if (assignDeep) {
            assignDeep.call(target, source);
        } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
            shapeReflections.assignDeepList(target, source);
        } else {
            shapeReflections.assignDeepMap(target, source);
        }
        return target;
    },
    updateMap: function (target, source) {
        var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
        var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
        var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
        shapeReflections.eachKey(target, function (curVal, key) {
            if (!sourceKeyMap.get(key)) {
                getSetReflections.deleteKeyValue(target, key);
                return;
            }
            sourceKeyMap.set(key, false);
            var newVal = sourceGetKeyValue.call(source, key);
            if (newVal !== curVal) {
                targetSetKeyValue.call(target, key, newVal);
            }
        }, this);
        shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
            if (sourceKeyMap.get(key)) {
                targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
            }
        });
        return target;
    },
    updateList: function (target, source) {
        var inserting = shapeReflections.toArray(source);
        getSetReflections.splice(target, 0, target, inserting);
        return target;
    },
    update: function (target, source) {
        if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
            shapeReflections.updateList(target, source);
        } else {
            shapeReflections.updateMap(target, source);
        }
        return target;
    },
    updateDeepMap: function (target, source) {
        var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
        var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
        var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
        shapeReflections.eachKey(target, function (curVal, key) {
            if (!sourceKeyMap.get(key)) {
                getSetReflections.deleteKeyValue(target, key);
                return;
            }
            sourceKeyMap.set(key, false);
            var newVal = sourceGetKeyValue.call(source, key);
            if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                targetSetKeyValue.call(target, key, newVal);
            } else {
                shapeReflections.updateDeep(curVal, newVal);
            }
        }, this);
        shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
            if (sourceKeyMap.get(key)) {
                targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
            }
        });
        return target;
    },
    updateDeepList: function (target, source) {
        return updateDeepList.call(this, target, source);
    },
    updateDeep: function (target, source) {
        var updateDeep = target[canSymbol.for('can.updateDeep')];
        if (updateDeep) {
            updateDeep.call(target, source);
        } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
            shapeReflections.updateDeepList(target, source);
        } else {
            shapeReflections.updateDeepMap(target, source);
        }
        return target;
    },
    hasKey: function (obj, key) {
        if (obj == null) {
            return false;
        }
        if (typeReflections.isPrimitive(obj)) {
            if (hasOwnProperty.call(obj, key)) {
                return true;
            } else {
                var proto;
                if (getPrototypeOfWorksWithPrimitives) {
                    proto = Object.getPrototypeOf(obj);
                } else {
                    proto = obj.__proto__;
                }
                if (proto !== undefined) {
                    return key in proto;
                } else {
                    return obj[key] !== undefined;
                }
            }
        }
        var hasKey = obj[canSymbol.for('can.hasKey')];
        if (hasKey) {
            return hasKey.call(obj, key);
        }
        var found = shapeReflections.hasOwnKey(obj, key);
        return found || key in obj;
    },
    getAllEnumerableKeys: function () {
    },
    getAllKeys: function () {
    },
    assignSymbols: function (target, source) {
        shapeReflections.eachKey(source, function (value, key) {
            var symbol = typeReflections.isSymbolLike(canSymbol[key]) ? canSymbol[key] : canSymbol.for(key);
            getSetReflections.setKeyValue(target, symbol, value);
        });
        return target;
    },
    isSerialized: isSerializedHelper,
    size: function (obj) {
        if (obj == null) {
            return 0;
        }
        var size = obj[sizeSymbol];
        var count = 0;
        if (size) {
            return size.call(obj);
        } else if (helpers.hasLength(obj)) {
            return obj.length;
        } else if (typeReflections.isListLike(obj)) {
            shapeReflections.eachIndex(obj, function () {
                count++;
            });
            return count;
        } else if (obj) {
            return shapeReflections.getOwnEnumerableKeys(obj).length;
        } else {
            return undefined;
        }
    },
    defineInstanceKey: function (cls, key, properties) {
        var defineInstanceKey = cls[canSymbol.for('can.defineInstanceKey')];
        if (defineInstanceKey) {
            return defineInstanceKey.call(cls, key, properties);
        }
        var proto = cls.prototype;
        defineInstanceKey = proto[canSymbol.for('can.defineInstanceKey')];
        if (defineInstanceKey) {
            defineInstanceKey.call(proto, key, properties);
        } else {
            Object.defineProperty(proto, key, shapeReflections.assign({
                configurable: true,
                enumerable: !typeReflections.isSymbolLike(key),
                writable: true
            }, properties));
        }
    }
};
shapeReflections.isSerializable = shapeReflections.isSerialized;
shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
module.exports = shapeReflections;