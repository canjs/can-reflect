var stealTools = require("steal-tools");

stealTools.export({
	steal: {
		config: __dirname + "/package.json!npm",
		main: "can-reflect/can-reflect-test"
	},
	outputs: {
		"+cjs": {},
		"+amd": {},
		"+global-js": {}
	}
}).catch(function(e){

	setTimeout(function(){
		throw e;
	},1);

});
