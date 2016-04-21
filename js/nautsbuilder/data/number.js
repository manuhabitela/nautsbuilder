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
 *   └─┬ Expression
 *     └── ExtendedExpression
 */

window.leiminauts = window.leiminauts || {};
leiminauts.number = leiminauts.number || {};

/**
 * Represents a numeric object that can be evaluated to receive a value. Each subclass needs to implement the method
 * 'value()'.
 * @class
 */
leiminauts.number.Number = (function() {
	var Number = function() {};
	var proto = Number.prototype;

	/**
	 * @returns {leiminauts.number.Value} evaluates this Number and returns its Value
	 */
	proto.value = function() {
		leiminauts.utils.throwNotImplemented("Number.prototype.value");
	};

	/**
	 * @param {string} [prefix] prefix for each number
	 * @param {string} [postfix] postfix for each number
	 * @returns {string} the string representation of the value with optional prefix and postfix for the individual numbers
	 */
	proto.toString = function(prefix, postfix) {
		return this.value().toString(prefix, postfix);
	};

	proto.isValue = function() {
		return this instanceof leiminauts.number.Value;
	};

	proto.isExpression = function() {
		return this instanceof leiminauts.number.Expression;
	};

	/**
	 * @param {arguments} args the function arguments
	 * @param {number} index the starting index of the Number to consider
	 * @returns {leiminauts.number.Number} Number from the arguments, either returning the first Number directly or creating a Value from the arguments
	 * @private
     */
	Number.ensureNumber = function(args, index) {
		index = index || 0;
		console.assert(_.isArguments(args));
		console.assert(args.length >= index+1);

		if (args[index] instanceof Number) {
			return args[index];
		}
		var stages = leiminauts.utils.argumentsToArray(args, index);
		return new leiminauts.number.Value(stages);
	};

	// Convenience function in order to write 'this._ensureNumber' instead of 'leiminauts.number.Number.ensureNumber'
	proto._ensureNumber = Number.ensureNumber;

	/**
	 * Takes a list of numbers and returns the sum of their values.
	 * @param {leiminauts.number.Number[]} numbers list of numbers
	 * @returns {leiminauts.number.Value} the sum of the values
	 */
	Number.sum = function(numbers) {
		return _.chain(numbers)
				.map(function(number) { return number.value(); })
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
				.map(function(number) { return number.value(); })
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
	 * @param {number[]|...number} stages An array of numbers or multiple numbers as arguments
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

	/**
	 * @returns {leiminauts.number.Value} this
     */
	proto.value = function() {
		return this;
	};

	/**
	 * @param {object} that object to compare to this
	 * @returns {boolean} True if and only if the other object is a Value and contains the same stages. False otherwise.
     */
	proto.equals = function(that) {
		if (this === that) return true;
		if (that === undefined) return false;
		if (!(that instanceof Value)) return false;
		if (this.length != that.length) return false;
		for (var i = 0; i < this.length; ++i) {
			if (this.stages[i] !== that.stages[i]) return false;
		}
		return true;
	};

	/**
	 * @param {string} [prefix] prefix for each number
	 * @param {string} [postfix] postfix for each number
	 * @returns {string} a string representation of the stages with the given prefix and postfix
	 */
	proto.toString = function(prefix, postfix) {
		prefix = prefix || "";
		postfix = postfix || "";
		return _(this.stages).map(function(stage) {
			return prefix + leiminauts.utils.number(stage) + postfix;
		}).join(' > ');
	};

	/** @returns {leiminauts.number.Value} the negated Value */
	proto.negate = function() {
		if (Value.ZERO.equals(this)) { return this; }
		return this._map(function(n) { return -n; });
	};

	/** @returns {leiminauts.number.Value} the reciprocal Value */
	proto.reciprocate = function() {
		if (Value.ONE.equals(this)) { return this; }
		return this._map(function(n) { return 1.0/n; });
	};

	/** @returns {leiminauts.number.Value} the minimum stage as Value */
	proto.min = function() {
		if (this.length == 1) { return this; }
		return this._collect(_.min);
	};

	/** @returns {leiminauts.number.Value} the maximum stage as Value */
	proto.max = function() {
		if (this.length == 1) { return this; }
		return this._collect(_.max);
	};

	/** @returns {leiminauts.number.Value} the average number of the stages as Value */
	proto.avg = function() {
		if (this.length == 1) { return this; }
		return this._collect(_.avg);
	};

	/** @returns {leiminauts.number.Value} the sum of the stages as Value */
	proto.sum = function() {
		if (this.length == 1) { return this; }
		return this._collect(_.sum);
	};

	/**
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Value} a new Value after adding given numbers to this
	 */
	proto.add = function(numbers) {
		var value = this._ensureNumber(arguments).value();
		if (Value.ZERO.equals(value)) { return this; }
		return this._mapPairwise(value, function(a, b) { return a+b; });
	};

	/**
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Value} a new Value after subtracting given numbers from this
	 */
	proto.subtract = function(numbers) {
		var value = this._ensureNumber(arguments).value();
		if (Value.ZERO.equals(value)) { return this; }
		return this._mapPairwise(value, function(a, b) { return a-b; });
	};

	/**
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Value} a new Value after multiplying given numbers with this
	 */
	proto.multiply = function(numbers) {
		var value = this._ensureNumber(arguments).value();
		if (Value.ONE.equals(value)) { return this; }
		return this._mapPairwise(value, function(a, b) { return a*b; });
	};

	/**
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Value} a new Value after dividing given numbers from this
	 */
	proto.divide = function(numbers) {
		var value = this._ensureNumber(arguments).value();
		if (Value.ONE.equals(value)) { return this; }
		return this._mapPairwise(value, function(a, b) { return a/b; });
	};

	/**
	 * @param {function} collector function that transforms the given stages
	 * @returns {leiminauts.number.Value} a new Value from applying collector to the stages array
	 * @private
	 */
	proto._collect = function(collector) {
		return new Value(collector(this.stages));
	};

	/**
	 * @param {function} mapper function that transforms each stage
	 * @returns {leiminauts.number.Value} a new Value from applying mapper to each stage
	 * @private
	 */
	proto._map = function(mapper) {
		return new Value(_.map(this.stages, mapper));
	};

	/**
	 * Returns a new Value by applying the given function pairwise to each stage of this and the given value. If the
	 * number of stages do not match each other, the shorter value is padded with the first stage.
	 *
	 * @param {leiminauts.number.Value} that Value to operate pairwise on with this
	 * @param {function} binaryOp function that given two numbers returns a number
	 * @returns {leiminauts.number.Value} a new Value from applying binaryOp pairwise to each stage of this and that
	 * @private
	 */
	proto._mapPairwise = function(that, binaryOp) {
		var zipped = _.zip(this.stages, that.stages);
		var stages = _(zipped).map(function(pair) {
			left  = pair[0] || this.stages[0];
			right = pair[1] || that.stages[0];
			return binaryOp(left, right);
		}, this);
		return new Value(stages);
	};

	Value.ZERO = new Value(0);
	Value.ONE  = new Value(1);

	// TODO: Add single stage cache?

	return Value;
})();

/**
 * Represents an expression that can be evaluated into a final Value. Each operation is inplace and only taken into
 * consideration when evaluating the expression with the method 'value()'.
 *
 * Expression contains two types of operations: Normal operations are right-associative and get evaluated in the order
 * they were added to this expression. Stacking operations are operations that stack additively with themselves; 'addStacking' together with
 * 'subtractStacking' and 'multiplyStacking' with 'divideStacking'. All stacking operations are execute before any other
 * operation. The expression of the stacking operations calculates the following:
 *
 * (base + sum(a_i) - sum(s_i)) * (1 + sum(m_i) + sum(1/d_i - 1))
 *
 * @class
 */
leiminauts.number.Expression = (function() {
	/**
	 * Types of possible operations for Expression. The value of a given OperationType relates to the prototype function
	 * of Value.
	 * @type {Object}
	 */
	var OperationType = Object.freeze({
		NEGATE:      "negate",
		RECIPROCATE: "reciprocate",
		MIN:         "min",
		MAX:         "max",
		AVG:         "avg",
		SUM:         "sum",
		ADD:         "add",
		SUBTRACT:    "subtract",
		MULTIPLY:    "multiply",
		DIVIDE:      "divide"
	});

	/**
	 * Creates a new Expression from the given instance count and the base Number or numbers.
	 * @param {number} instanceCount instance count, has to be greater than 0
	 * @param {leiminauts.number.Number|...number} The base number, given as a Number or multiple numbers as arguments
	 * @constructor
     */
	var Expression = function(instanceCount, values) {
		leiminauts.number.Number.call(this);
		console.assert(instanceCount >= 1, "Assertion failed: instanceCount must be >= 1, but was", instanceCount);
		this.instanceCount = instanceCount;
		this.base = leiminauts.number.Number.ensureNumber(arguments, 1);
		this._operations = [];
		this._stackingAdditions = [];
		this._stackingSubtractions = [];
		this._stackingMultiplications = [];
		this._stackingDivisions = [];
	};

	var proto = leiminauts.utils.extendPrototype(leiminauts.number.Number, Expression);
	proto.operations = function() { return this._operations; };
	proto.stackingAdditions = function() { return this._stackingAdditions; };
	proto.stackingSubtractions = function() { return this._stackingSubtractions; };
	proto.stackingMultiplications = function() { return this._stackingMultiplications; };
	proto.stackingDivisions = function() { return this._stackingDivisions; };

	proto.value = function() {
		return this._evaluateWithBaseValue(this.base.value(), 1);
	};

	proto.instanceValue = function() {
		var baseNumber = this.base;
		// If we got more than one instance or baseNumber is not an expression
		// directly return our value divided by our instanceCount
		if (this.instanceCount > 1 || !baseNumber.isExpression()) {
			var resultValue = this.value().divide(this.instanceCount);
			return { count: this.instanceCount, value: resultValue };
		}

		console.assert(baseNumber.isExpression());
		var basePair = baseNumber.instanceValue();
		var baseCount = basePair.count;
		var baseValue = basePair.value;
		var resultValue = this._evaluateWithBaseValue(baseValue, baseCount);
		return { count: baseCount, value: resultValue };
	};

	proto._evaluateWithBaseValue = function(baseValue, baseInstanceCount) {
		var value = this._applyStacking(baseValue, baseInstanceCount);
		value = this._applyOperations(value, baseInstanceCount);

		if (baseInstanceCount == 1) {
			value = value.multiply(this.instanceCount);
		}

		return value;
	};

	proto._applyStacking = function(baseValue, baseInstanceCount) {
		var result = baseValue;
		var stackAdds = this.stackingAdditions();
		var stackSubs = this.stackingSubtractions();
		var stackMults = this.stackingMultiplications();
		var stackDivs = this.stackingDivisions();

		if (!_.isEmpty(stackAdds)) {
			result = result.add(leiminauts.number.Number.sum(stackAdds).divide(baseInstanceCount));
		}

		if (!_.isEmpty(stackSubs)) {
			// result - a_1 - .. a_n = result - sum(a_i)
			result = result.subtract(leiminauts.number.Number.sum(stackSubs).divide(baseInstanceCount));
		}

		if (!_.isEmpty(stackMults) || !_.isEmpty(stackDivs)) {
			// sum(a_i - 1)
			var stackMultSum = _(stackMults).chain()
				.map(function(number) { return number.value().subtract(1); })
				.reduce(function(left, right) { return left.add(right); }, leiminauts.number.Value.ZERO)
				.value();

			// x / b = x * 1/b = x * (1/b + 1 - 1) = x * (1 + (1/b - 1))
			// => sum(1/b_i - 1)
			var stackDivSum = _(stackDivs).chain()
				.map(function(number) { return number.value(); })
				.map(function(value) { return leiminauts.number.Value.ONE.divide(value).subtract(leiminauts.number.Value.ONE); })
				.reduce(function(left, right) { return left.add(right); }, leiminauts.number.Value.ZERO)
				.value();

			// result * (1 + sum(a_i - 1) + sum(1/b_i - 1))
			result = result.multiply(leiminauts.number.Value.ONE.add(stackMultSum).add(stackDivSum));
		}

		return result;
	};

	proto._applyOperations = function(baseValue, baseInstanceCount) {
		return _(this.operations()).reduce(function(value, op) {
			opValue = op.number ? op.number.value() : undefined;

			// Extract baseInstanceCount out of operation
			if (op.type === OperationType.ADD || op.type === OperationType.SUBTRACT) {
				// value*i +- op = (value +- op/i) * i
				// => op/i
				opValue = opValue.divide(baseInstanceCount);
			} else if (op.type === OperationType.RECIPROCATE) {
				// 1/(value*i) = 1/(value*i) * i/i = 1/(value*i*i) * i
				// => value * i * i
				value = value.multiply(baseInstanceCount).multiply(baseInstanceCount);
			}

			// The values of OperationType match the names of the prototype functions of Value
			// E.g. value.negate() -> value['negate']() -> Value.prototype['negate'](value)
			return leiminauts.number.Value.prototype[op.type].call(value, opValue);
		}, baseValue);
	};

	proto.toString = function(prefix, postfix) {
		var instance = this.instanceValue();
		var instanceValue = instance.value;
		var instanceCount = instance.count;

		var totalValue = instanceValue.multiply(instanceCount);
		var str = totalValue.toString(prefix, postfix);
		if (instanceCount > 1) {
			str += " (";

			if (instanceValue.length > 1) str += '[';
			str += instance.value.toString(prefix, postfix);
			if (instanceValue.length > 1) str += ']';

			str += '×';
			str += instanceCount;
			str += ")";
		}

		return str;
	};

	/**
	 * Negates the expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.negate = function() {
		this._operations.push({ type: OperationType.NEGATE });
		return this;
	};

	/**
	 * Takes the reciprocal of the expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.reciprocate = function() {
		this._operations.push({ type: OperationType.RECIPROCATE });
		return this;
	};

	/**
	 * Takes the minimum stage of the current expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.min = function() {
		this._operations.push({ type: OperationType.MIN });
		return this;
	};

	/**
	 * Takes the maximum stage of the current expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.max = function() {
		this._operations.push({ type: OperationType.MAX });
		return this;
	};

	/**
	 * Takes the average number of all stages of the current expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.avg = function() {
		this._operations.push({ type: OperationType.AVG });
		return this;
	};

	/**
	 * Takes the sum of all stages of the current expression.
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.sum = function() {
		this._operations.push({ type: OperationType.SUM });
		return this;
	};

	/**
	 * Adds the given number(s) to the expression.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
     */
	proto.add = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ZERO.equals(number)) {
			this._operations.push({ type: OperationType.ADD, number: number });
		}
		return this;
	};

	/**
	 * Subtracts the given number(s) from the expression.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.subtract = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ZERO.equals(number)) {
			this._operations.push({ type: OperationType.SUBTRACT, number: number });
		}
		return this;
	};

	/**
	 * Multiplies the expression with the given number(s).
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.multiply = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ONE.equals(number)) {
			this._operations.push({ type: OperationType.MULTIPLY, number: number });
		}
		return this;
	};

	/**
	 * Divides the expression by the given number(s).
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.divide = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ONE.equals(number)) {
			this._operations.push({ type: OperationType.DIVIDE, number: number });
		}
		return this;
	};

	/**
	 * Adds the given number(s) to the additive stack.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.addStacking = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ZERO.equals(number)) {
			this._stackingAdditions.push(number);
		}
		return this;
	};

	/**
	 * Subtracts the given number(s) from the additive stack.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.subtractStacking = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ZERO.equals(number)) {
			this._stackingSubtractions.push(number);
		}
		return this;
	};

	/**
	 * Adds the given number(s) to the multiplicative stack.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.multiplyStacking = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ONE.equals(number)) {
			this._stackingMultiplications.push(number);
		}
		return this;
	};

	/**
	 * Adds the given number(s) to the multiplicative stack as a division.
	 * @param {leiminauts.number.Number|...number} numbers Either a Number or multiple numbers as arguments
	 * @returns {leiminauts.number.Expression} this
	 */
	proto.divideStacking = function(numbers) {
		var number = this._ensureNumber(arguments);
		if (!leiminauts.number.Value.ONE.equals(number)) {
			this._stackingDivisons.push(number);
		}
		return this;
	};

	return Expression;
})();

/**
 * Represents an expression that extends another. All operations do not influence the extended object. All stacking
 * operations stack with the extended object. The normal operations of this object are executed after the operations
 * of the extended object.
 *
 * @class
 */
leiminauts.number.ExtendedExpression = (function() {
	/**
	 * Creates a new ExtendedExpression by extending the given Expression.
	 * @param {leiminauts.number.Expression} expression to be extended expression
	 * @constructor
     */
	var ExtendedExpression = function(expression) {
		leiminauts.number.Expression.call(this, expression.instanceCount, expression.base);
		this.proxy = expression;
	};

	var proto = leiminauts.utils.extendPrototype(leiminauts.number.Expression, ExtendedExpression);
	proto.operations = function() {
		return this.proxy.operations().concat(this._operations);
	};
	proto.stackingAdditions = function() {
		return this.proxy.stackingAdditions().concat(this._stackingAdditions);
	};
	proto.stackingSubtractions = function() {
		return this.proxy.stackingSubtractions().concat(this._stackingSubtractions);
	};
	proto.stackingMultiplications = function() {
		return this.proxy.stackingMultiplications().concat(this._stackingMultiplications);
	};
	proto.stackingDivisions = function() {
		return this.proxy.stackingDivisions().concat(this._stackingDivisions);
	};

	return ExtendedExpression;
})();