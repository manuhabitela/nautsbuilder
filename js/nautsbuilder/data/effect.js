/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

leiminauts = leiminauts || {};
leiminauts.effect = leiminauts.effect || {};

leiminauts.effect.Effect = function(name) {
  this.name = name;
}
leiminauts.effect.Effect.prototype.isNumeric = function() { return false; }
leiminauts.effect.Effect.prototype.toString = function() { return undefined; }


leiminauts.effect.NumericEffect = function(name, prefix, postfix, baseValues) {
  leiminauts.effect.Effect.call(this, name);
  this.prefix = prefix;
  this.postfix = postfix;

  this.effectStages = _(baseValues).map(function(baseValue) {
    if (baseValue instanceof leiminauts.effectnumber.EffectNumber) {
      return new leiminauts.effectnumber.ExtendedEffectNumber(baseValue);
    } else {
      return new leiminauts.effectnumber.EffectNumber(baseValue);
    }
  });
}
leiminauts.effect.NumericEffect.prototype = Object.create(leiminauts.effect.Effect.prototype);
leiminauts.effect.NumericEffect.prototype.constructor = leiminauts.effect.NumericEffect;
leiminauts.effect.NumericEffect.prototype.isNumeric = function() { return true; }
leiminauts.effect.NumericEffect.prototype.isRelative = function() { return this.postfix === "%"; }
leiminauts.effect.NumericEffect.prototype.isMultiplicative = function() {
  return this.prefix === "×" || this.prefix === "/";
}
leiminauts.effect.NumericEffect.prototype.toString = function() {
  return _(this.effectStages).map(function(ev) {
    var str = "";
    if (this.prefix !== "@") str += this.prefix;
    str += leiminauts.utils.number(ev.getValue());
    str += this.postfix;
    return str;
  }, this).join(' > ');
}


// Creates a new NumericEffect that extends & references this.
// Useful for creating effects that are tied to others, e.g. DPS of damage
leiminauts.effect.NumericEffect.prototype.extend = function(effectName) {
  return new leiminauts.effect.NumericEffect(effectName, this.prefix, this.postfix, this.effectStages);
}


leiminauts.effect.StringEffect = function(name, value) {
  leiminauts.effect.Effect.call(this, name);
  this._value = value;
}
leiminauts.effect.StringEffect.prototype = Object.create(leiminauts.effect.Effect.prototype);
leiminauts.effect.StringEffect.prototype.constructor = leiminauts.effect.StringEffect;
leiminauts.effect.StringEffect.prototype.toString = function() { return String(this._value); }


leiminauts.effect.numberRegex = /^(\+|-|\/|×|@)?([0-9]*\.?[0-9]+)([%s])?$/i;
leiminauts.effect.matchNumberRegex = function(number) {
  var regexResults = leiminauts.effect.numberRegex.exec(number);
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
}

leiminauts.effect.effectFromValues = function(effectName, values) {
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
      var match = leiminauts.effect.matchNumberRegex(part.trim());
      return match;
    });
  });

  if (leiminauts.effect.existsUndefinedMatch(stagedMatches)) {
    return leiminauts.effect.stringEffectFromValues(effectName, values);
  } else {
    return leiminauts.effect.numericEffectFromValues(effectName, stagedMatches);
  }
}

leiminauts.effect.existsUndefinedMatch = function(stagedMatches) {
  var testResult = _(stagedMatches).some(function(matches) {
    return _(matches).contains(undefined);
  });
  return testResult;
}

leiminauts.effect.stringEffectFromValues = function(effectName, values) {
  if (values.length > 1) {
    console.log("Warning: unable to merge non-numeric effect " + effectName + ": " + values + "'. Ignoring upgrades...");
  }
  return new leiminauts.effect.StringEffect(effectName, values[0]);
}

leiminauts.effect.numericEffectFromValues = function(effectName, stagedMatches) {
  leiminauts.effect.padStages(stagedMatches);
  var base = leiminauts.effect.findBaseAndRemove(stagedMatches);
  //console.log("Using '" + base.numbers.join(' > ') + "' with prefix: '" + base.prefix + "' and postfix: '" + base.postfix + "' as base.");
  var effect = new leiminauts.effect.NumericEffect(effectName, base.prefix, base.postfix, base.numbers);
  if (stagedMatches.length > 0) {
    leiminauts.effect.applyUpgrades(effect, stagedMatches);
  }
  return effect;
}

// Padds each step (base and upgrades) with the respective first value to the maximum number of stages found
leiminauts.effect.padStages = function(stagedMatches) {
  var maxNrStages = _(stagedMatches).max(function(s) {
    return s.length;
  }).length;

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
}

// Finds the base effect, removes it from argument and returns base properties
leiminauts.effect.findBaseAndRemove = function(stagedMatches) {
  var notUndefined = function(obj) { return obj !== undefined; };
  var affixesOfUpgrades = _(stagedMatches).map(function(upgradeMatches, index) {
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
}

/*
  prefixes: '', '+', '×', '/'
  postfixes: '', '%', 's'

  Order by:
  1. !(pre == '×' || pre == '/') <<< (pre == '×' || pre == '/')
  2. post == 's' <<< post == '' <<< post == '%'
  3. pre == '' <<< pre != ''
*/
leiminauts.effect.affixComparator = function(a, b) {
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
}

leiminauts.effect.applyUpgrades = function(effect, upgradesMatches) {
  // Transpose upgradesMatches from
  // [upgrade_0: [stages], ..., upgrade_n: [stages]] to
  // [stage_0: [upgrades], ..., stage_n: [upgrades]]
  var upgradesPerStages = _(upgradesMatches).transpose();
  _(upgradesPerStages).each(function(upgrades, index) {
    var effectNumber = effect.effectStages[index];
    _(upgrades).each(function(upgradeMatch) {
      leiminauts.effect.addUpgradeToEffectNumber(effectNumber, upgradeMatch, effect.isRelative());
    });
  });
}

leiminauts.effect.addUpgradeToEffectNumber = function(effectNumber, upgradeMatch, baseIsRelative) {
  var number = upgradeMatch.number;
  if (upgradeMatch.prefix === "@") {
    // Do nothing, because base is fixed
    return;
  }

  if (upgradeMatch.postfix === "%" && !baseIsRelative) {
    // Adapt number to reflect relative calculation to base
    number /= 100;
  }

  if (upgradeMatch.prefix === "×") {
    effectNumber.addMultiplicative(number - 1);
  } else if (upgradeMatch.prefix === "/") {
    effectNumber.addMultiplicative(1/number - 1);
  } else {
    if (upgradeMatch.postfix === "%" && !baseIsRelative) {
      effectNumber.addRelativeAdditive(number);
    } else {
      effectNumber.addAbsoluteAdditive(number);
    }
  }
}
