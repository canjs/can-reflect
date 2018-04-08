/*can-reflect@1.14.2#reflections/get-set/get-set*/
var canSymbol = require('can-symbol');
var typeReflections = require('../type/type.js');
var setKeyValueSymbol = canSymbol.for('can.setKeyValue'), getKeyValueSymbol = canSymbol.for('can.getKeyValue'), getValueSymbol = canSymbol.for('can.getValue'), setValueSymbol = canSymbol.for('can.setValue');
var reflections = {
    setKeyValue: function (obj, key, value) {
        if (typeReflections.isSymbolLike(key)) {
            if (typeof key === 'symbol') {
                obj[key] = value;
            } else {
                Object.defineProperty(obj, key, {
                    enumerable: false,
                    configurable: true,
                    value: value,
                    writable: true
                });
            }
            return;
        }
        var setKeyValue = obj[setKeyValueSymbol];
        if (setKeyValue !== undefined) {
            return setKeyValue.call(obj, key, value);
        } else {
            obj[key] = value;
        }
    },
    getKeyValue: function (obj, key) {
        var getKeyValue = obj[getKeyValueSymbol];
        if (getKeyValue) {
            return getKeyValue.call(obj, key);
        }
        return obj[key];
    },
    deleteKeyValue: function (obj, key) {
        var deleteKeyValue = obj[canSymbol.for('can.deleteKeyValue')];
        if (deleteKeyValue) {
            return deleteKeyValue.call(obj, key);
        }
        delete obj[key];
    },
    getValue: function (value) {
        if (typeReflections.isPrimitive(value)) {
            return value;
        }
        var getValue = value[getValueSymbol];
        if (getValue) {
            return getValue.call(value);
        }
        return value;
    },
    setValue: function (item, value) {
        var setValue = item && item[setValueSymbol];
        if (setValue) {
            return setValue.call(item, value);
        } else {
            throw new Error('can-reflect.setValue - Can not set value.');
        }
    },
    splice: function (obj, index, removing, adding) {
        var howMany;
        if (typeof removing !== 'number') {
            var updateValues = obj[canSymbol.for('can.updateValues')];
            if (updateValues) {
                return updateValues.call(obj, index, removing, adding);
            }
            howMany = removing.length;
        } else {
            howMany = removing;
        }
        var splice = obj[canSymbol.for('can.splice')];
        if (splice) {
            return splice.call(obj, index, howMany, adding);
        }
        return [].splice.apply(obj, [
            index,
            howMany
        ].concat(adding));
    },
    addValues: function (obj, adding, index) {
        var add = obj[canSymbol.for('can.addValues')];
        if (add) {
            return add.call(obj, adding, index);
        }
        if (Array.isArray(obj) && index === undefined) {
            return obj.push.apply(obj, adding);
        }
        return reflections.splice(obj, index, [], adding);
    },
    removeValues: function (obj, removing, index) {
        var removeValues = obj[canSymbol.for('can.removeValues')];
        if (removeValues) {
            return removeValues.call(obj, removing, index);
        }
        if (Array.isArray(obj) && index === undefined) {
            removing.forEach(function (item) {
                var index = obj.indexOf(item);
                if (index >= 0) {
                    obj.splice(index, 1);
                }
            });
            return;
        }
        return reflections.splice(obj, index, removing, []);
    }
};
reflections.get = reflections.getKeyValue;
reflections.set = reflections.setKeyValue;
reflections['delete'] = reflections.deleteKeyValue;
module.exports = reflections;