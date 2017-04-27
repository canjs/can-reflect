var canSymbol = require("can-symbol");

var slice = [].slice;

function makeFallback(symbolName, fallbackName) {
	return function(obj, event, handler){
		var method = obj[canSymbol.for(symbolName)];
		if(method !== undefined) {
			return method.call(obj, event, handler);
		}
		return this[fallbackName].apply(this, arguments);
	};
}

function makeErrorIfMissing(symbolName, errorMessage){
	return function(obj, arg1, arg2){
		var method = obj[canSymbol.for(symbolName)];
		if(method !== undefined) {
			return method.call(obj, arg1, arg2);
		}
		throw new Error(errorMessage);
	};
}

/**
 * @module can-reflect/observe Observe
 * @parent can-reflect
 *
 * The `Observe` suite of reflections covers event binding for key values on observable MapLike objects, and for
 * the values of observable ValueLike objects.
 */
module.exports = {
	// KEY
	/**
	 * @function {Object, String, function(*)} can-reflect/observe.onKeyValue onKeyValue
	 * @parent can-reflect/observe
	 * @description  Register an event handler on a MapLike object, based on a key change
	 * 
	 * @signature `onKeyValue(obj, key, handler)`
	 * @param {Object} obj an observable MapLike that can listen to changes in named properties.
	 * @param {String} key  the key to listen to
	 * @param {function(*)} handler a callback function that recieves the new value
	 */
	onKeyValue: makeFallback("can.onKeyValue", "onEvent"),
	/**
	 * @function {Object, String, function(*)} can-reflect/observe.offKeyValue offKeyValue
	 * @parent can-reflect/observe
	 * @description  Unregister an event handler on a MapLike object, based on a key change
	 * 
	 * @signature `offKeyValue(obj, key, handler)`
	 * @param {Object} obj an observable MapLike that can listen to changes in named properties.
	 * @param {String} key  the key to stop listening to
	 * @param {function(*)} handler the callback function that should be removed from the event handlers for `key`
	 */
	offKeyValue: makeFallback("can.offKeyValue","offEvent"),

	/**
	 * @function {Object, function(Array)} can-reflect/observe.onKeys onKeys
	 * @parent can-reflect/observe
	 * @description  Register an event handler on a MapLike object, triggered on the key set changing
	 * 
	 * @signature `onKeys(obj, handler)`
	 * @param {Object} obj an observable MapLike that can listen to changes in named properties.
	 * @param {function(Array)} handler the callback function to receive the diffs in the key set
	 */
	// any key change (diff would normally happen)
	onKeys: makeErrorIfMissing("can.onKeys","can-reflect: can not observe an onKeys event"),
	/**
	 * @function {Object, function(Array)} can-reflect/observe.onKeysAdded onKeysAdded
	 * @parent can-reflect/observe
	 * @description  Register an event handler on a MapLike object, triggered on new keys being added.
	 * 
	 * @signature `onKeysAdded(obj, handler)`
	 * @param {Object} obj an observable MapLike that can listen to changes in named properties.
	 * @param {function(Array)} handler the callback function to receive the array of added keys
	 */
	// keys added at a certain point {key: 1}, index
	onKeysAdded: makeErrorIfMissing("can.onKeysAdded","can-reflect: can not observe an onKeysAdded event"),
	/**
	 * @function {Object, function(Array)} can-reflect/observe.onKeysRemoved onKeysRemoved
	 * @parent can-reflect/observe
	 * @description  Register an event handler on a MapLike object, triggered on keys being deleted.
	 * 
	 * @signature `onKeysRemoved(obj, handler)`
	 * @param {Object} obj an observable MapLike that can listen to changes in named properties.
	 * @param {function(Array)} handler the callback function to receive the array of removed keys
	 */
	onKeysRemoved: makeErrorIfMissing("can.onKeysRemoved","can-reflect: can not unobserve an onKeysRemoved event"),

	/**
	 * @function {Object, String} can-reflect/observe.getKeyDependencies getKeyDependencies
	 * @parent can-reflect/observe
	 * @description  Return all the events that bind to the value of a named property on an object
	 *
	 * @signature `getKeyDependencies(obj, key)`
	 * @param {Object} obj the object to check for key dependencies
	 * @param {String} key the key on the object to check
	 * @return {Array} descriptors of the event bindings that this binding depends on
	 * 
	 */
	getKeyDependencies: makeErrorIfMissing("can.getKeyDependencies","can-reflect: can not determine dependencies"),

	/**
	 * @function {Object, String} can-reflect/observe.keyHasDependencies keyHasDependencies
	 * @parent can-reflect/observe
	 * @description  Determine whether the value for a named property on an object is bound to other events
	 *
	 * @signature `keyHasDependencies(obj, key)`
	 * @param {Object} obj the object to check for key dependencies
	 * @param {String} key the key on the object to check
	 * @return {Boolean} `true` if there are other dependencies that may update the keyed value; `false` otherwise
	 * 
	 */
	// TODO: use getKeyDeps once we know what that needs to look like
	keyHasDependencies: makeErrorIfMissing("can.keyHasDependencies","can-reflect: can not determine if this has key dependencies"),

	// VALUE
	/**
	 * @function {Object, function(*)} can-reflect/observe.onValue onValue
	 * @parent can-reflect/observe
	 * @description  Register an event handler on an observable ValueLike object, based on a change in its value
	 * 
	 * @signature `onValue(handler)`
	 * @param {*} obj
	 * @param {function(*)} handler
	 */
	onValue: makeErrorIfMissing("can.onValue","can-reflect: can not observe value change"),
	/**
	 * @function {Object, function(*)} can-reflect/observe.offValue offValue
	 * @parent can-reflect/observe
	 * @description  Unregister an value change handler from an observable ValueLike object
	 * 
	 * @signature `offValue(handler)`
	 * @param {*} obj
	 * @param {function(*)} handler
	 */
	offValue: makeErrorIfMissing("can.offValue","can-reflect: can not unobserve value change"),

	/**
	 * @function {Object} can-reflect/observe.getValueDependencies getValueDependencies
	 * @parent can-reflect/observe
	 * @description  Return all the events that bind to the value of an observable, ValueLike object
	 *
	 * @signature `getValueDependencies(obj)`
	 * @param {Object} obj the object to check for value dependencies
	 * @return {Array} descriptors of the event bindings that `obj`'s value depends on
	 * 
	 */
	getValueDependencies: makeErrorIfMissing("can.getValueDependencies","can-reflect: can not determine dependencies"),

	/**
	 * @function {Object} can-reflect/observe.valueHasDependencies valueHasDependencies
	 * @parent can-reflect/observe
	 * @description  Determine whether the value of an observable object is bound to other events
	 *
	 * @signature `valueHasDependencies(obj)`
	 * @param {Object} obj the object to check for dependencies
	 * @return {Boolean} `true` if there are other dependencies that may update the object's value; `false` otherwise
	 * 
	 */
	// TODO: use getValueDeps once we know what that needs to look like
	valueHasDependencies: makeErrorIfMissing("can.valueHasDependencies","can-reflect: can not determine if value has dependencies"),


	// EVENT
	/**
	 * @function {Object, String, function(*)} can-reflect/observe.onEvent onEvent
	 * @parent can-reflect/observe
	 * @description  Register a named event handler on an observable object
	 * 
	 * @signature `onEvent(obj, eventName, callback)`
	 * @param {Object} obj the object to bind a new event handler to
	 * @param {String} eventName the name of the event to bind the handler to
	 * @param {function(*)} callback  the handler function to bind to the event
	 */
	onEvent: function(obj, eventName, callback){
		if(obj) {
			var onEvent = obj[canSymbol.for("can.onEvent")];
			if(onEvent !== undefined) {
				return onEvent.call(obj, eventName, callback);
			} else if(obj.addEventListener) {
				obj.addEventListener(eventName, callback);
			}
		}
	},
	/**
	 * @function {Object, String, function(*)} can-reflect/observe.offValue offEvent
	 * @parent can-reflect/observe
	 * @description  Unregister an event handler on a MapLike object, based on a key change
	 * 
	 * @signature `offKeyValue(obj, eventName, callback)`
	 * @param {Object} obj the object to unbind an event handler from
	 * @param {String} eventName the name of the event to unbind the handler from
	 * @param {function(*)} callback the handler function to unbind from the event
	 */
	offEvent: function(obj, eventName, callback){
		if(obj) {
			var offEvent = obj[canSymbol.for("can.offEvent")];
			if(offEvent !== undefined) {
				return offEvent.call(obj, eventName, callback);
			}  else if(obj.removeEventListener) {
				obj.removeEventListener(eventName, callback);
			}
		}

	}
};
