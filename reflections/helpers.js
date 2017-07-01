var canSymbol = require("can-symbol");

module.exports = {
	makeGetFirstSymbolValue: function(symbolNames){
		var symbols = symbolNames.map(function(name){
			return canSymbol.for(name);
		});
		var length = symbols.length;

		return function getFirstSymbol(obj){
			var index = -1;

			while (++index < length) {
				if(obj[symbols[index]] !== undefined) {
					return obj[symbols[index]];
				}
			}
		};
	}
};
