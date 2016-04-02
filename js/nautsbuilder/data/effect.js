/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

window.leiminauts = window.leiminauts || {};
leiminauts.effect = leiminauts.effect || {};

leiminauts.effect.Effect = (function() {
  var Effect = function(name) {
    this.name = name;
  };
  var proto = Effect.prototype;

  Object.defineProperties(proto, {
    key: { get: function() { return this.name; } },
    value: { get: function() { return undefined; } }
  });

  proto.isNumeric = function() { return false; }

  return Effect;
})();


leiminauts.effect.NumericEffect = (function() {
  var NumericEffect = function(name, prefix, postfix, effectNumbers) {
    leiminauts.effect.Effect.call(this, name);
    this.prefix = prefix;
    this.postfix = postfix;
    this.effectNumbers = effectNumbers;
  }
  NumericEffect.prototype = Object.create(leiminauts.effect.Effect.prototype);
  var proto = NumericEffect.prototype;
  proto.constructor = NumericEffect;

  Object.defineProperty(proto, "value", {
    get: function() { return this.numbersToString(); }
  });

  proto.isNumeric = function() { return true; }
  proto.isRelative = function() { return this.postfix === "%"; }
  proto.isMultiplicative = function() { return this.prefix === "×" || this.prefix === "/"; }
  proto.numbersToString = function() {
    return _(this.effectNumbers.valuesOf()).map(function(num) {
      var str = "";
      if (this.prefix !== "@") str += this.prefix;
      str += leiminauts.utils.number(num);
      str += this.postfix;
      return str;
    }, this).join(' > ');
  };

  return NumericEffect;
})();

leiminauts.effect.StringEffect = (function() {
  var StringEffect = function(name, value) {
    leiminauts.effect.Effect.call(this, name);
    this._value = value;
  };
  StringEffect.prototype = Object.create(leiminauts.effect.Effect.prototype);
  var proto = StringEffect.prototype;
  proto.constructor = StringEffect;

  Object.defineProperty(proto, 'value', {
    get: function() { return this._value; }
  });

  return StringEffect;
})();

leiminauts.effect.effectFromValues = (function() {
  // Function that returns a StringEffect or NumericEffect from the given name and list of values
  var effectFromValues = function(name, values) {
    if (Object.prototype.toString.call(values) !== "[object Array]") {
      console.log("Parameter values '" + values + "' must be an array!");
      return undefined;
    }
    if (values.length < 1) {
      console.log("Empty array of values.");
      return undefined;
    }

    var stagedMatches = _(values).map(function(value) {
      var parts = String(value).split('>');
      return _(parts).map(function(part) {
        var trimmed = _(part).trim();
        return matchNumberRegex(trimmed);
      });
    });

    if (existsUndefinedMatch(stagedMatches)) {
      // Found at least one value or staged value that is non-numeric
      return stringEffectFromValues(name, values);
    } else {
      return numericEffectFromValues(name, stagedMatches);
    }
  };

  var numberRegex = /^(\+|-|\/|×|@)?([0-9]*\.?[0-9]+)([%s])?$/i;
  // Returns the results of matching a number with the regex
  var matchNumberRegex = function(number) {
    var regexResults = numberRegex.exec(number);
    if (regexResults === null) {
      return undefined;
    }

    if (regexResults[1] === undefined) {
      regexResults[1] = "";
    } else if (regexResults[1] === "-") {
      // Remove '-' from prefix group and add it to number group
      regexResults[1] = "";
      regexResults[2] = "-" + regexResults[2];
    }

    if (regexResults[3] === undefined) {
      regexResults[3] = "";
    }

    return {
      prefix: regexResults[1],
      number: Number(regexResults[2]),
      postfix: regexResults[3]
    };
  };

  var existsUndefinedMatch = function(stagedMatches) {
    return _(stagedMatches).some(function(matches) {
      return _(matches).contains(undefined);
    });
  };

  var stringEffectFromValues = function(name, values) {
    if (values.length > 1) {
      console.log("Warning: unable to merge non-numeric effect " + name + ": " + values + "'. Ignoring upgrades...");
    }
    return new leiminauts.effect.StringEffect(name, values[0]);
  };

  var numericEffectFromValues = function(name, stagedMatches) {
    padStagedMatches(stagedMatches);
    var base = findBaseAndRemove(stagedMatches);
    //console.log("Using '" + base.numbers.join(' > ') + "' with prefix: '" + base.prefix + "' and postfix: '" + base.postfix + "' as base.");
    var prefix = base.prefix;
    var postfix = base.postfix;
    var baseNumbers = base.numbers;

    var calcNumbers = leiminauts.effectnumber.CalculatedNumbers.fromNumbers(baseNumbers);
    if (stagedMatches.length > 0) {
      var baseNumbersAreRelative = postfix === "%";
      applyUpgrades(calcNumbers, stagedMatches, baseNumbersAreRelative);
    }

    return new leiminauts.effect.NumericEffect(name, prefix, postfix, calcNumbers);
  };

  // Pads every step to the maximum number of stages found
  // The step is padded by its first match (value)
  var padStagedMatches = function(stagedMatches) {
    var maxNrStages = _.chain(stagedMatches).map(function (matches) {
      return matches.length;
    }).max().value();

    _(stagedMatches).each(function(matches) {
      var nrStages = matches.length;
      for (var i = 0; i < maxNrStages - nrStages; ++i) {
        matches.push({
          prefix: matches[0].prefix,
          number: matches[0].number,
          postfix: matches[0].postfix
        });
      }
    });
  };

  // Finds the base effect, removes it from argument and returns base properties
  var findBaseAndRemove = function(stagedMatches) {
    var notUndefined = function(obj) { return obj !== undefined; };
    var affixesOfUpgrades = _(stagedMatches).map(function(upgradeMatches, index) {
      // Return first prefix & postfix that is not undefined
      var prefix = _(upgradeMatches).map(function(m) { return m.prefix; }).find(notUndefined);
      var postfix = _(upgradeMatches).map(function(m) { return m.postfix; }).find(notUndefined);
      return {"index": index, "prefix": prefix, "postfix": postfix};
    });

    affixesOfUpgrades.sort(leiminauts.effect.affixComparator);
    var base = affixesOfUpgrades[0];
    var baseMatches = stagedMatches.splice(base.index, 1)[0];
    var baseNumbers = _(baseMatches).map(function(m) { return m.number; });
    return {
      prefix: base.prefix,
      postfix: base.postfix,
      numbers: baseNumbers
    };
  };


  /*
    This functions comares to prefix-postfix pairs. A prefix-postfix pair is
    smaller than another if it is more likely to be a base value.
    The ordering rules are the following:
     1. !(pre == '×' || pre == '/') <<< (pre == '×' || pre == '/')
     2. post == 's' <<< post == '' <<< post == '%'
     3. pre == '' <<< pre != ''

    Possible prefixes: '', '+', '×', '/'
    Possible postfixes: '', '%', 's'

    This ordering makes it so that all multiplicative pairs appear last (most
    unlikely to be a base value). Then, a value with seconds comes before a
    value without an unit which comes before a percentage value. Finally, a
    empty prefix is more likely to be a base value than a non-empty one.
  */
  var affixComparator = function(a, b) {
    // Order multiplicative prefixes always last
    var aMultPrefix = a.prefix === "×" || a.prefix === "/";
    var bMultPrefix = b.prefix === "×" || b.prefix === "/";
    if (!aMultPrefix && bMultPrefix) {
      return -1;
    } else if (aMultPrefix && !bMultPrefix) {
      return 1;
    }

    // Order postfix: 's' < '' < '%'
    if (a.postfix === "s" && b.postfix !== "s") {
      return -1;
    } else if (a.postfix !== "s" && b.postfix === "s") {
      return 1;
    }

    if (a.postfix !== "%" && b.postfix === "%") {
      return -1;
    } else if (a.postfix === "%" && b.postfix !== "%") {
      return 1;
    }

    // Order prefix: '' <  '+' or '×' or '/'
    if (a.postfix === "" && b.postfix !== "") {
      return -1;
    } else if (a.postfix !== "" && b.postfix === "") {
      return 1;
    }

    // Stable sort
    return a.index - b.index;
  };

  var applyUpgrades = function(calcNumbers, upgradesMatches, baseNumbersAreRelative) {
    // Transpose upgradesMatches from
    // [upgrade_0: [stages], ..., upgrade_n: [stages]] to
    // [stage_0: [upgrades], ..., stage_n: [upgrades]]
    var upgradesPerStages = _(upgradesMatches).transpose();
    _(upgradesPerStages).each(function(upgrades, index) {
      var calcNumber = calcNumbers[index]; // TODO: use zip
      _(upgrades).each(function(upgradeMatch) {
        applyUpgrade(calcNumber, upgradeMatch, baseNumbersAreRelative);
      });
    });
  };

  var applyUpgrade = function(calcNumber, upgradeMatch, baseNumbersAreRelative) {
    var number = upgradeMatch.number;
    if (upgradeMatch.prefix === "@") {
      // Do nothing, because base is fixed
      // TODO: maybe set calcNumber.base = number ?
      return;
    }

    if (upgradeMatch.postfix === "%" && !baseNumbersAreRelative) {
      // Adapt number to reflect relative calculation to base
      number /= 100;
    }

    if (upgradeMatch.prefix === "×") {
      calcNumber.additiveMultiply(number - 1);
    } else if (upgradeMatch.prefix === "/") {
      // base/number === base * (1 + (1/number - 1))
      calcNumber.additiveMultiply(1/number - 1);
    } else {
      if (upgradeMatch.postfix === "%" && !baseNumbersAreRelative) {
        calcNumber.relativeAdd(number);
      } else {
        calcNumber.absoluteAdd(number);
      }
    }
  };


  return effectFromValues;
})();
