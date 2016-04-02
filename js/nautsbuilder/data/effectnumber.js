/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

window.leiminauts = window.leiminauts || {};
leiminauts.effectnumber = leiminauts.effectnumber || {};

// FIXME: check if type checks are needed?

/*
  An effect number is a number for a specific effect, that is potentially built from several others.
  There are three basic classes:
    - CalculatedNumber
    - ExtendedCalculatedNumber extends CalculatedNumber
    - AggregatedNumber

    and additionally CalculatedNumbers, an decorated array of CalculatedNumber objects

   All of these implement the following methods:
   - valueOf: returns the effective, primitive number that corresponds to the effect number
   - extend: returns a new CalculatedNumber of the current effect number, extending it
*/

// Effect number that is calculated in a specific way (additive and multiplicative values stacking only additively)
leiminauts.effectnumber.CalculatedNumber = (function() {
  var CalculatedNumber = function(effectNumber) {
    this._base = effectNumber;
    this._relativeAdditives = [];
    this._absoluteAdditives = [];
    this._multiplicatives = [];
    this._multipliers = [];
  };
  var proto = CalculatedNumber.prototype;

  Object.defineProperties(proto, {
    base:              { get: function() { return this._base; } },
    relativeAdditives: { get: function() { return this._relativeAdditives; } },
    absoluteAdditives: { get: function() { return this._absoluteAdditives; } },
    multiplicatives:   { get: function() { return this._multiplicatives; } },
    multipliers:       { get: function() { return this._multipliers; } }
  });

  proto.relativeAdd = function(number) {
    this._relativeAdditives.push(number);
    return this;
  };
  proto.absoluteAdd = function(number) {
    this._absoluteAdditives.push(number);
    return this;
  };
  proto.additiveMultiply = function(number) {
    this._multiplicatives.push(number);
    return this;
  };
  proto.multiply = function(number) {
    this._multipliers.push(number);
    return this;
  };
  proto.valueOf = function() {
    // Use getters to retrieve the individual values
    // Using sum and prod because the Javascript engine calls valueOf() for those calculations
    var relAdd  = _(this.relativeAdditives).sum();
    var absAdd = _(this.absoluteAdditives).sum();
    var addMult = _(this.multiplicatives).sum();
    var multiplier = _(this.multipliers).prod();
    return (this.base * (1 + relAdd) + absAdd) * (1 + addMult) * multiplier;
  };
  proto.extend = function() {
    return leiminauts.effectnumber.ExtendedCalculatedNumber.fromCalculated(this);
  };

  CalculatedNumber.fromBase = function(baseNumber) { return new CalculatedNumber(baseNumber); }

  return CalculatedNumber;
})();

// EffectNumber that extends CalculatedNumber by adding more terms to the original calculation
leiminauts.effectnumber.ExtendedCalculatedNumber = (function() {
  var ExtendedCalculatedNumber = function(calculatedNumber) {
    leiminauts.effectnumber.CalculatedNumber.call(this, calculatedNumber.base);
    this.proxy = calculatedNumber;
  }
  ExtendedCalculatedNumber.prototype = Object.create(leiminauts.effectnumber.CalculatedNumber.prototype);
  var proto = ExtendedCalculatedNumber.prototype;
  proto.constructor = ExtendedCalculatedNumber;

  // Overwrite getters to adjust the calculation of this.valueOf()
  Object.defineProperties(proto, {
    relativeAdditives: { get: function() { return this.proxy.relativeAdditives.concat(this._relativeAdditives); } },
    absoluteAdditives: { get: function() { return this.proxy.absoluteAdditives.concat(this._absoluteAdditives); } },
    multiplicatives:   { get: function() { return this.proxy.multiplicatives.concat(this._multiplicatives); } },
    multipliers:       { get: function() { return this.proxy.multipliers.concat(this._multipliers); } },
  });

  ExtendedCalculatedNumber.fromCalculated = function(calculatedNumber) { return new ExtendedCalculatedNumber(calculatedNumber); }

  return ExtendedCalculatedNumber;
})();

// Effect number that calculates its value by aggregating over a list of effect numbers (e.g. min, max, average)
// Note that the aggregation is only done when calling valueOf, not during initialization
leiminauts.effectnumber.AggregatedNumber = (function() {
  // aggregateFunction takes a list of (effect) numbers and returns a primitive value
  var AggregatedNumber = function(numbers, aggregateFunction) {
    this.numbers = numbers;
    this.aggregateFunction = aggregateFunction;
  }
  var proto = AggregatedNumber.prototype;
  proto.valueOf = function() {
    return this.aggregateFunction(this.numbers);
  };
  proto.extend = function() {
    return leiminauts.effectnumber.CalculatedNumber.fromBase(this);
  };

  AggregatedNumber.fMax = function(numbers) { return _.max(numbers).valueOf(); }
  AggregatedNumber.fMin = function(numbers) { return _.min(numbers).valueOf(); }
  AggregatedNumber.fAvg = function(numbers) { return _.avg(numbers).valueOf(); }

  AggregatedNumber.max = function(numbers) { return new AggregatedNumber(numbers, AggregatedNumber.fMax); }
  AggregatedNumber.min = function(numbers) { return new AggregatedNumber(numbers, AggregatedNumber.fMin); }
  AggregatedNumber.avg = function(numbers) { return new AggregatedNumber(numbers, AggregatedNumber.fAvg); }

  return AggregatedNumber;
})();

// Helper class with utility functions that help modifying a list of CalculatedNumber
leiminauts.effectnumber.CalculatedNumbers = (function() {
  // Decorate an array consisting of CalculatedNumbers with utility functions
  // Private method because it works inplace
  var decorateCalculatedNumbersArray = function(array) {
    var nonCalcNum = _(array).find(function(cn) {
      return !(cn instanceof leiminauts.effectnumber.CalculatedNumber);
    });
    if (nonCalcNum !== undefined) {
      console.log("Error: found object that is not instance of CalculatedNumber:");
      console.log(nonCalcNum);
      return; // Do nothing
    }

    array._eachPair = function(numbers, func) {
      if (this.length !== numbers.length) {
        console.log("Error: argument does not have the same length for pair-wise operation ("
          + this.length + " != " + numbers.length + "). Ignoring operation...");
        return; // Do nothing
      }
      var zipped = _.zip(this, numbers);
      return _(zipped).each(function(pair) {
        func(pair[0], pair[1]);
      });
    }

    // Methods to add a single number to all instances
    array.relativeAdd = function(number) {
      _(this).each(function(cn) { cn.relativeAdd(number); });
      return this;
    };
    array.absoluteAdd = function(number) {
      _(this).each(function(cn) { cn.absoluteAdd(number); });
      return this;
    };
    array.additiveMultiply = function(number) {
      _(this).each(function(cn) { cn.additiveMultiply(number); });
      return this;
    };
    array.multiply = function(number) {
      _(this).each(function(cn) { cn.multiply(number); });
      return this;
    };

    // Methods to add pair-wise add a number to an instance
    array.pairwiseRelativeAdd = function(numbers) {
      this._eachPair(numbers, function(cn, num) {
        cn.relativeAdd(num);
      });
      return this;
    };
    array.pairwiseAbsoluteAdd = function(numbers) {
      this._eachPair(numbers, function(cn, num) {
        cn.absoluteAdd(num);
      });
      return this;
    };
    array.pairwiseAdditiveMultiply = function(numbers) {
      this._eachPair(numbers, function(cn, num) {
        cn.additiveMultiply(num);
      });
      return this;
    };
    array.pairwiseMultiply = function(numbers) {
      this._eachPair(numbers, function(cn, num) {
        cn.multiply(num);
      });
      return this;
    };

    // Utility methods that return a new aggregated effect number
    array.maxAggregate = function() {
      return leiminauts.effectnumber.AggregatedNumber.max(this);
    };
    array.minAggregate = function() {
      return leiminauts.effectnumber.AggregatedNumber.min(this);
    };
    array.avgAggregate = function() {
      return leiminauts.effectnumber.AggregatedNumber.avg(this);
    };
    // Utility function that returns the values of each CalculatedNumber
    array.valuesOf = function() {
      return _(this).map(function(cn) { return cn.valueOf(); });
    };
    array.extend = function() {
      var extendedCalcNums = _(this).map(function(cn) { return cn.extend(); });
      return decorateCalculatedNumbersArray(extendedCalcNums);
    };

    return array;
  }
  var CalculatedNumbers = {};
  // Creates a new, decorated array from the existing CalculatedNumber objects
  CalculatedNumbers.fromCalcNumbers = function(calcNumbers) {
    var result = calcNumbers.slice();
    return decorateCalculatedNumbersArray(result);
  };
  // Creates a new, decorated array that uses the provided numbers as base value for new CalculatedNumber objects
  CalculatedNumbers.fromNumbers = function(numbers) {
    var calcNumbers = _(numbers).map(function(num) {
      return leiminauts.effectnumber.CalculatedNumber.fromBase(num);
    });
    return decorateCalculatedNumbersArray(calcNumbers);
  };

  return CalculatedNumbers;
})();
