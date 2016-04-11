/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

/*
 * This file contains classes that can be used to calculate and combine different numbers.
 *
 * Available classes:
 *   Number (interface)
 *   ├── Value
 *   ├── AggregatedNumber
 *   └─┬ CalculatedNumber
 *     └── ExtendedCalculatedNumber
 */

window.leiminauts = window.leiminauts || {};
leiminauts.number = leiminauts.number || {};

/**
 * Represents a numeric object that can be evaluated to receive a value. Each subclass needs to implement the property
 * 'value'.
 * @class
 */
leiminauts.number.Number = (function() {
	var Number = function() {};

	/**
	 * @property {leiminauts.number.Value}
	 * @name Number#value
	 * @abstract
	 */
	Object.defineProperty(Number.prototype, 'value', {
		get: function() { leiminauts.utils.throwNotImplemented("Number.prototype.value"); }
	});

	/**
	 * @param {string} [prefix] prefix for each number
	 * @param {string} [postfix] postfix for each number
	 * @returns {string} the string representation of the value with optional prefix and postfix for the individual numbers
	 */
	Number.prototype.toString = function(prefix, postfix) {
		return this.value.toString(prefix, postfix);
	};

	/**
	 * Takes a list of numbers and returns the sum of their values.
	 * @param {leiminauts.number.Number[]} numbers list of numbers
	 * @returns {leiminauts.number.Value} the sum of the values
	 */
	Number.sum = function(numbers) {
		return _.chain(numbers)
				.map(function(number) { return number.value; })
				.reduce(function(left, right) { return left.add(right); }, leiminauts.number.Value.ZERO)
				.value();
	};

	/**
	 * Takes a list of numbers and returns the product of their values.
	 * @param {leiminauts.number.Number[]} numbers list of numbers
	 * @returns {leiminauts.number.Value} the product of the values
	 */
	Number.product = function(numbers) {
		return _.chain(numbers)
				.map(function(number) { return number.value; })
				.reduce(function(left, right) { return left.multiply(right); }, leiminauts.number.Value.ONE)
				.value();
	};

	return Number;
})();

/**
 * Represents a numeric value with multiple stages. A Value can be combined with other numbers or Values into a new
 * Value. Value should be treated immutable. Each operation creates a new Value.
 *
 * @class
 */
leiminauts.number.Value = (function() {
	/**
	 * Creates a new Value from multiple stages of numbers.
	 * @param {number[]|number} stages An array of numbers or multiple numbers as arguments
	 * @constructor
	 */
	var Value = function(values) {
		leiminauts.number.Number.call(this);

		if (_.isArray(values)) {
			this.stages = values;
		} else {
			// If stages is not an array, convert the arguments object into an array
			this.stages = leiminauts.utils.argumentsToArray(arguments);
		}

		this.length = this.stages.length;
	};

	var proto = leiminauts.utils.extendPrototype(leiminauts.number.Number, Value);

	Value.ZERO = new Value(0);
	Value.ONE = new Value(1);

	Object.defineProperty(proto, 'value', { get: function() {
		return this;
	}});

	/**
	 * @param {string} [prefix] prefix for each number
	 * @param {string} [postfix] postfix for each number
	 * @returns {string}
	 */
	proto.toString = function(prefix, postfix) {
		if (prefix === undefined) { prefix = ""; }
		if (postfix === undefined) { postfix = ""; }
		return _(this.stages).map(function(stage) {
			return prefix + leiminauts.utils.number(stage) + postfix;
		}).join(' > ');
	};

	/** @returns {leiminauts.number.Value} the negated values */
	proto.negate = function() {
		return this._mapStages(function(stage) { return -stage; });
	};

	/** @returns {leiminauts.number.Value} the reciprocal values */
	proto.reciprocal = function() {
		return this._mapStages(function(stage) { return 1.0/stage; });
	};

	/**
	 * @param {number|leiminauts.number.Value} value Value or number to add
	 * @returns {leiminauts.number.Value} a new Value after adding value to this
	 */
	proto.add = function(value) {
		if (_.isNumber(value)) {
			return this._mapStages(function(stage) { return stage + value; });
		} else {
			console.assert(value instanceof leiminauts.number.Value, value);
			return this._operatePairwise(value, function(left, right) { return left+right; });
		}
	};

	/**
	 * @param {number|leiminauts.number.Value} value Value or number to substract
	 * @returns {leiminauts.number.Value} a new Value after substracting value from this
	 */
	proto.substract = function(value) {
		if (_.isNumber(value)) {
			return this.add(-value);
		} else {
			console.assert(value instanceof leiminauts.number.Value, value);
			return this.add(value.negate());
		}
	};

	/**
	 * @param {number|leiminauts.number.Value} value Value or number to multiply
	 * @returns {leiminauts.number.Value} a new Value after multiplying this with the value
	 */
	proto.multiply = function(value) {
		if (_.isNumber(value)) {
			return this._mapStages(function(stage) { return stage * value; });
		} else {
			console.assert(value instanceof leiminauts.number.Value, value);
			return this._operatePairwise(value, function(left, right) { return left * right; });
		}
	};

	/**
	 * @param {number|leiminauts.number.Value} value Value or number to divide
	 * @returns {leiminauts.number.Value} a new Value after dividing value from this
	 */
	proto.divide = function(value) {
		if (_.isNumber(value)) {
			return this.multiply(1.0/value);
		} else {
			console.assert(value instanceof leiminauts.number.Value, value);
			return this.multiply(value.reciprocal());
		}
	};

	/**
	 * @param {function} unaryOp function that transforms a number
	 * @returns {Value} a new Value from applying unaryOp to each stage
	 * @private
	 */
	proto._mapStages = function(unaryOp) {
		return new Value(_(this.stages).map(unaryOp));
	};

	/**
	 * Returns a new Value by applying the given function pairwise to each stage of this and the given value. If either
	 * of the values contain only one stage, then this stage is always applied.
	 * Logs a warning if the two values have incompatible sizes.
	 *
	 * @param {Value} that Value to operate pairwise on with this
	 * @param {function} unaryOp function that returns a number from two parameters
	 * @returns {Value} a new Value from applying binaryOp pairwise to each stage of this and that
	 * @private
	 */
	proto._operatePairwise = function(that, binaryOp) {
		if (this.length !== that.length && this.length > 1 && that.length > 1) {
			console.log("Warning: incompatible sizes, ignoring operation with ", that);
			return this;
		}

		console.assert(this.length === that.length || this.length === 1 || that.length === 1);
		var length = Math.max(this.length, that.length);
		var resultStages = [];
		for (var i = 0; i < length; ++i) {
			var left  = this.length === 1 ? this.stages[0] : this.stages[i];
			var right = that.length === 1 ? that.stages[0] : that.stages[i];
			resultStages.push(binaryOp(left, right));
		}
		return new Value(resultStages);
	};

	return Value;
})();

/**
 * Represents a Number that aggregates the stages of a given number.
 * @class
 */
leiminauts.number.AggregatedNumber = (function() {
	/**
	 * Creates a new AggregatedNumber with a given Number and an aggregation function. As a value it aggregates all the stages of the
	 * given number.
	 *
	 * @param {leiminauts.number.Number} number Number to aggregate
	 * @param {function} aggregate function that takes a list of numbers and returns a number
	 * @constructor
	 */
	var AggregatedNumber = function(number, aggregate) {
		leiminauts.number.Number.call(this);
		this.number = number;
		this.aggregate = aggregate;
	};

	var proto = leiminauts.utils.extendPrototype(leiminauts.number.Number, AggregatedNumber);

	/**
	 * @property {leiminauts.number.Value} The aggregate of the stages of the given number.
	 * @name leiminauts.number.AggregatedNumber#value
	 * @override
	 */
	Object.defineProperty(proto, 'value', {
		get: function() {
			var value = this.number.value;
			var stages = value.stages;
			var result = this.aggregate(stages);
			return new leiminauts.number.Value(result);
		}
	});

	/**
	 * @param {leiminauts.number.Number} number
	 * @returns {AggregatedNumber} a new AggregatedNumber that returns the minimum
	 */
	AggregatedNumber.min = function(number) {
		return new AggregatedNumber(number, function(stages) {
			return _.min(stages);
		})
	};

	/**
	 * @param {leiminauts.number.Number} number
	 * @returns {AggregatedNumber} a new AggregatedNumber that returns the maximum
	 */
	AggregatedNumber.max = function(number) {
		return new AggregatedNumber(number, function(stages) {
			return _.max(stages);
		})
	};

	/**
	 * @param {leiminauts.number.Number} number
	 * @returns {AggregatedNumber} a new AggregatedNumber that returns the average
	 */
	AggregatedNumber.avg = function(number) {
		return new AggregatedNumber(number, function(stages) {
			return _.avg(stages);
		})
	};

	/**
	 * @param {leiminauts.number.Number} number
	 * @returns {AggregatedNumber} a new AggregatedNumber that returns the sum
	 */
	AggregatedNumber.sum = function(number) {
		return new AggregatedNumber(number, function(stages) {
			return _.sum(stages);
		})
	};

	/**
	 * @param {leiminauts.number.Number} number
	 * @returns {AggregatedNumber} a new AggregatedNumber that returns the product
	 */
	AggregatedNumber.prod = function(number) {
		return new AggregatedNumber(number, function(stages) {
			return _.prod(stages);
		})
	};

	return AggregatedNumber;
})();

/**
 * Represents a Number that is calculated with a base Number and various Numbers applied to it. It supports four
 * different operations:
 *  - adding a Number
 *  - adding a Number relative to the base, that is a percentage value
 *  - multiplying a Number with each multiplication stacking additively
 *  - multiplying a Number
 *
 * Additionally, it contains a number, showing how often the base number occurs.
 *
 * @class
 */
leiminauts.number.CalculatedNumber = (function() {
	/**
	 *
	 * @param {number} instanceCount number of instances that this number contains
	 * @param {leiminauts.number.Number|number[]} baseNumber base Number or stages
	 * @constructor
	 */
	var CalculatedNumber = function(instanceCount, baseNumber) {
		leiminauts.number.Number.call(this);
		this.instanceCount = instanceCount;
		this.base = CalculatedNumber._numberFromArguments(arguments, 1);
		this._absoluteAdditions = [];
		this._relativeAdditions = [];
		this._additiveMultipliers = [];
		this._multipliers = [];
	};
	var proto = leiminauts.utils.extendPrototype(leiminauts.number.Number, CalculatedNumber);

	Object.defineProperties(proto, {
		absoluteAdditions:   { get: function() { return this._absoluteAdditions; } },
		relativeAdditions:   { get: function() { return this._relativeAdditions; } },
		additiveMultipliers: { get: function() { return this._additiveMultipliers; } },
		multipliers:         { get: function() { return this._multipliers; } }
	});

	/**
	 * @property {leiminauts.number.Value} the calculated Value from the given Numbers. Note that this property is calculated.
	 * @name CalculatedNumber#value
	 * @override
	 */
	Object.defineProperty(proto, 'value', {
		get: function() {
			var baseValue = this.base.value;
			var absoluteAddition = leiminauts.number.Number.sum(this.absoluteAdditions);
			var relativeAddition = leiminauts.number.Number.sum(this.relativeAdditions);
			var additiveMultiplier = leiminauts.number.Number.sum(this.additiveMultipliers);
			var multiplier = leiminauts.number.Number.product(this.multipliers);
			return CalculatedNumber._calculateFromValues(baseValue, absoluteAddition, relativeAddition, additiveMultiplier, multiplier, this.instanceCount);
		}
	});

	/**
	 * @property @return {{count: number, value: leiminauts.number.Value}} the calculated value of an instance together
	 *    with its count. This property calculates its value by recursively checking whether a base value exists with an
	 *    instance count higher than 1 and returning as soon as it finds one.
	 * @name CalculatedNumber#value
	 */
	Object.defineProperty(proto, 'instanceValue', {
		get: function() {
			if (this.instanceCount > 1) {
				// We got more than one instance ourselves
				return {count: this.instanceCount, value: this.value.divide(this.instanceCount)};
			}

			if (!(this.base instanceof leiminauts.number.CalculatedNumber)) {
				// Only a CalculatedNumber can have multiple instances
				return {count: 1, value: this.value};
			}

			var basePair = this.base.instanceValue;
			var baseCount = basePair.count;
			var baseValue = basePair.value;

			// Fix the addition because we factorize baseCount out of the equation
			var absoluteAddition = leiminauts.number.Number.sum(this.absoluteAdditions).divide(baseCount);
			var relativeAddition = leiminauts.number.Number.sum(this.relativeAdditions);
			var additiveMultiplier = leiminauts.number.Number.sum(this.additiveMultipliers);
			var multiplier = leiminauts.number.Number.product(this.multipliers);

			var instanceValue = CalculatedNumber._calculateFromValues(baseValue, absoluteAddition, relativeAddition, additiveMultiplier, multiplier, 1);
			return {count: baseCount, value: instanceValue};
		}
	});

	/**
	 * @param {string} [prefix] prefix for each number
	 * @param {string} [postfix] postfix for each number
	 * @returns {string} the string representation of this number. If an instanceValue with a count higher than one is
	 *    found, this value is additionally displayed
	 * @override
	 */
	proto.toString = function(prefix, postfix) {
		var instance = this.instanceValue;
		var totalValue = instance.value.multiply(instance.count);

		var str = totalValue.toString(prefix, postfix);
		if (instance.count > 1) {
			str += " (";

			if (instance.value.length > 1) str += '[';
			str += instance.value.toString(prefix, postfix);
			if (instance.value.length > 1) str += ']';

			str += '×';
			str += instance.count;
			str += ")";
		}

		return str;
	};

	/**
	 * Adds a Number to add to the calculation.
	 * @param {leiminauts.number.Number|number[]} number Number or stages to add
	 * @returns {leiminauts.number.Number} this for chaining
	 */
	proto.absoluteAdd = function(number) {
		var num = CalculatedNumber._numberFromArguments(arguments);
		this._absoluteAdditions.push(num);
		return this;
	};

	/**
	 * Adds a Number to add relatively to the base Number.
	 * @param {leiminauts.number.Number|number[]} number Number or stages to add relatively
	 * @returns {leiminauts.number.Number} this for chaining
		 */
	proto.relativeAdd = function(number) {
		var num = CalculatedNumber._numberFromArguments(arguments);
		this._relativeAdditions.push(num);
		return this;
	};

	/**
	 * Adds a Number to multiply. All of these multiplications stack additively.
	 * @param {leiminauts.number.Number|number[]} number Number or stages to multiply additively
	 * @returns {leiminauts.number.Number} this for chaining
	 */
	proto.additiveMultiply = function(number) {
		var num = CalculatedNumber._numberFromArguments(arguments);
		this._additiveMultipliers.push(num);
		return this;
	};

	/**
	 * Adds a Number to multiply to the calculation.
	 * @param {leiminauts.number.Number|number[]} number Number or stages to multiply
	 * @returns {leiminauts.number.Number} this for chaining
		 */
	proto.multiply = function(number) {
		var num = CalculatedNumber._numberFromArguments(arguments);
		this._multipliers.push(num);
		return this;
	};

	/**
	 * @param arguments the function's arguments
	 * @param {number} index the index of the single argument
	 * @returns {leiminauts.number.Number} If the index'th argument is a Number, returns it. Otherwise creates a new Value
	 *     from all the arguments beginning from index.
	 * @private
	 */
	CalculatedNumber._numberFromArguments = function(arguments, index) {
		var index = index | 0;
		if (index >= arguments.length) {
			console.log("Error: index is out of bounds (index: " + index + ", arguments.length: " + arguments.length + ")");
			return leiminauts.number.Value.ZERO; // return a somewhat meaningful value
		}

		var elem = arguments[index];
		if (elem instanceof leiminauts.number.Number) {
			return elem;
		}

		var elements = leiminauts.utils.argumentsToArray(arguments, index);
		return new leiminauts.number.Value(elements);
	};

	/**
	 * Executes the calculation, given the base Value and the different Values to operate.
	 * The calculation is the following:
	 * @example
	 * var result = (base * (1 + relativeAddition) + absoluteAddition) * (1 + additiveMultiplier) * multiplier * instanceCount;
	 *
	 * @param {leiminauts.number.Value} baseValue the base Value
	 * @param {leiminauts.number.Value} absoluteAddition the Value to add
	 * @param {leiminauts.number.Value} relativeAddition the Value to add relatively to the base
	 * @param {leiminauts.number.Value} additiveMultiplier the Value to multiply (additively)
	 * @param {leiminauts.number.Value} multiplier the Value to multiply
	 * @param {number} instanceCount the instance count of the calculation
	 * @returns {leiminauts.number.Value} the calculated Value from the given Values
	 * @private
	 */
	CalculatedNumber._calculateFromValues = function(baseValue, absoluteAddition, relativeAddition, additiveMultiplier, multiplier, instanceCount) {
		// (base * (1 + relAdd) + absAdd) * (1 + additiveMultiplier) * multiplier * finalMultiplier;
		return baseValue.multiply(relativeAddition.add(leiminauts.number.Value.ONE)).add(absoluteAddition)
				.multiply(additiveMultiplier.add(leiminauts.number.Value.ONE))
				.multiply(multiplier)
				.multiply(instanceCount);
	};

	return CalculatedNumber;
})();

/**
 * Represents a CalculatedNumber that is extended. Operations on this object do not influence the extended (proxy)
 * object. All calculations based on the list of numbers stack accordingly.
 */
leiminauts.number.ExtendedCalculatedNumber = (function() {
	/**
	 * Creates a new ExtendedCalculatedNumber by extending the given CalculatedNumber
	 * @param {leiminauts.number.CalculatedNumber} proxy CalculatedNumber to extend from
	 * @constructor
	 */
	var ExtendedCalculatedNumber = function(proxy) {
		leiminauts.number.CalculatedNumber.call(this, proxy.instanceCount, proxy.base);
		this.proxy = proxy;
	};
	var proto = leiminauts.utils.extendPrototype(leiminauts.number.CalculatedNumber, ExtendedCalculatedNumber);

	// Overwrite the getter properties to include the proxy's as well as the Numbers from this instance
	Object.defineProperties(proto, {
		absoluteAdditions:   { get: function() { return this.proxy.absoluteAdditions.concat(this._absoluteAdditions); } },
		relativeAdditions:   { get: function() { return this.proxy.relativeAdditions.concat(this._relativeAdditions); } },
		additiveMultipliers: { get: function() { return this.proxy.additiveMultipliers.concat(this._additiveMultipliers); } },
		multipliers:         { get: function() { return this.proxy.multipliers.concat(this._multipliers); } }
	});

	return ExtendedCalculatedNumber;
})();
