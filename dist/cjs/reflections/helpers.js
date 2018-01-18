/*can-reflect@1.12.0#reflections/helpers*/
var canSymbol = require('can-symbol');
module.exports = {
    makeGetFirstSymbolValue: function (symbolNames) {
        var symbols = symbolNames.map(function (name) {
            return canSymbol.for(name);
        });
        var length = symbols.length;
        return function getFirstSymbol(obj) {
            var index = -1;
            while (++index < length) {
                if (obj[symbols[index]] !== undefined) {
                    return obj[symbols[index]];
                }
            }
        };
    },
    hasLength: function (list) {
        var type = typeof list;
        var length = list && type !== 'boolean' && typeof list !== 'number' && 'length' in list && list.length;
        return typeof list !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in list);
    }
};