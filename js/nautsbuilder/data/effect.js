/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

window.leiminauts = window.leiminauts || {};
leiminauts.effect = leiminauts.effect || {};

leiminauts.effect.Effect = (function() {
	var Effect = function(effectName) {
		this.name = effectName;
		this.key = this.name;
	};
	var proto = Effect.prototype;

	Object.defineProperties(proto, {
		'value': { get: function() { leiminauts.utils.throwNotImplemented("Effect.prototype.value"); } }
	});

	proto.toString = function() { return this.key + ": " + this.value; };
	proto.isScalable = function() { return false; };

	return Effect;
})();

/**
 * Represents an Effect with a numeric value. Additionally contains prefix and postfix for the numbers.
 * @class
 */
leiminauts.effect.NumericEffect = (function() {
	/**
	 * Creates a new NumericEffect from the given name, prefix, postfix and number.
	 * @param {string} effectName name of the effect
	 * @param {string} prefix prefix of the number
	 * @param {string} postfix postfix of the number
	 * @param {leiminauts.number.Number} number value as Number
	 * @constructor
	 */
	var NumericEffect = function(effectName, prefix, postfix, number) {
		leiminauts.effect.Effect.call(this, effectName);
		this.prefix = prefix;
		this.postfix = postfix;

		console.assert(number instanceof leiminauts.number.Number, "Assertion failed: found non-Number", number);
		this.number = number;
	};
	var proto = leiminauts.utils.extendPrototype(leiminauts.effect.Effect, NumericEffect);

	Object.defineProperty(proto, 'value', { get: function() {
		var prefix = this.prefix === "@" ? "" : this.prefix;
		return this.number.toString(prefix, this.postfix);
	}});

	/** @returns {boolean} True if this effect can be scaled. False otherwise. */
	proto.isScalable = function() { return !this.isRelative() && !this.isMultiplicative(); };
	/** @returns {boolean} True if this effect is percentage based. False otherwise */
	proto.isRelative = function() { return this.postfix === "%"; };
	/** @returns {boolean} True if this effect is multiplicative. False otherwise */
	proto.isMultiplicative = function() { return this.prefix === "×" || this.prefix === "/"; };
	/**
	 * Scales this effect by the given level and scaling value according to (1 + (level-1)*scalingValue)
	 * @param {number} level the level
	 * @param {number} scalingValue the increase per level
	 */
	proto.applyScaling = function(level, scalingValue) {
		if (level < 1) { level = 1; }
		if (level > 20) { level = 20; }

		var scalingMultiplier = (1 + (level-1)*scalingValue);

		if (!this.number.isExpression()) {
			console.log("Warning: try to scale a non-Expression", this.number);
			this.number = new leiminauts.number.Expression(1, this.number);
		}

		this.number.multiply(scalingMultiplier);
	};

	return NumericEffect;
})();

/**
 * Represents an Effect with a string value.
 *
 * @class
 */
leiminauts.effect.StringEffect = (function() {
	/**
	 * Creates a new StringEffect from the given name and value.
	 *
	 * @param {string} effectName name of the effect
	 * @param {string} value value
	 * @constructor
	 */
	var StringEffect = function(effectName, value) {
		leiminauts.effect.Effect.call(this, effectName);
		Object.defineProperty(this, 'value', { get: function() {
			return value;
		}});
	};
	leiminauts.utils.extendPrototype(leiminauts.effect.Effect, StringEffect);
	return StringEffect;
})();

/**
 * Given a string listing all effects returns a list of Effects.
 * @param {string} effectsString a string containing key:value pairs separated by ';'
 * @returns {leiminauts.effect.Effect[]} list of resulting Effects
 */
leiminauts.effect.effectsFromString = function(effectsString) {
	var keyValuePairs = leiminauts.utils.treatEffects(effectsString);
	return _(keyValuePairs).map(function(pair) {
		return leiminauts.effect.effectFromString(pair.key, pair.value);
	});
};

/**
 * Creates an Effect from a given name and string value
 * @param {string} name effect name
 * @param {value} value effect value
 * @returns {leiminauts.effect.Effect} a NumericEffect if value can be parsed into a list of numbers, a StringEffect otherwise.
 */
leiminauts.effect.effectFromString = (function() {
	var effectFromString = function(effectName, effectValue) {
		var stages = String(effectValue).split('>');
		var matches = _(stages).map(function(stage) {
			return matchNumberRegex(_.trim(stage));
		});

		if (_(matches).contains(undefined)) {
			// Found a non-numeric match
			return new leiminauts.effect.StringEffect(effectName, effectValue);
		}

		var prefix = findLastNonEmpty(matches, 'prefix');
		var postfix = findLastNonEmpty(matches, 'postfix');
		var value = new leiminauts.number.Value(_(matches).pluck('number'));
		return new leiminauts.effect.NumericEffect(effectName, prefix, postfix, value);
	};

	var findLastNonEmpty = function(matches, attribute) {
		var elem = _.chain(matches)
			.pluck(attribute)
			.reverse()
			.find(function(e) { return e !== ""; })
			.value();
		return elem !== undefined ? elem : "";
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

	return effectFromString;
})();

/**
 * Merges a list of effects into one. If a non-NumericEffect exists, it returns the first effect. If all effects are
 * numeric, it creates a new NumericEffect and merges the value of the effect number into it.
 *
 * @param {leiminauts.effect.Effect[]} effects list of effects, must contain at least one element
 * @returns {leiminauts.effect.Effect} the merged effect
 */
leiminauts.effect.mergeEffects = (function() {
	var mergeEffects = function(effects) {
		console.assert(effects.length >= 1, effects);
		var containsOnlyNumeric = _(effects).every(function(effect) {
			return effect instanceof leiminauts.effect.NumericEffect;
		});
		if (!containsOnlyNumeric) {
			if (effects.length > 1) {
				console.log("Warning: cannot merge non-NumericEffects, ignoring upgrades of ", effects);
			}

			return effects[0];
		}

		var baseEffect = findAndRemoveBaseEffect(effects);
		var upgradeEffects = effects;

		var resultNumber = new leiminauts.number.Expression(1, baseEffect.number.value());
		var resultEffect = new leiminauts.effect.NumericEffect(baseEffect.name, baseEffect.prefix, baseEffect.postfix, resultNumber);

		_(upgradeEffects).each(function(upgradeEffect) {
			applyUpgradeToEffect(resultEffect, upgradeEffect);
		});

		return resultEffect;
	};

	/**
	 * Finds the base effect based on the ordering given by affixComparator. Removes the base effect from effects and
	 * returns it.
	 * @param {leiminauts.effect.NumericEffect[]} effects list of NumericEffects
	 * @returns {leiminauts.effect.NumericEffect}
	 */
	var findAndRemoveBaseEffect = function(effects) {
		var affixes = _(effects).map(function(effect, index) {
			return {index: index, prefix: effect.prefix, postfix: effect.postfix};
		});
		affixes.sort(affixComparator);
		var baseAffix = affixes[0];
		var baseEffect = effects.splice(baseAffix.index, 1)[0];
		return baseEffect;
	};

	/**
	 * This functions compares two prefix-postfix pairs. A prefix-postfix pair is
	 * smaller than another if it is more likely to be a base value.
	 * The ordering rules are the following:
	 * 1. !(pre == '×' || pre == '/') <<< (pre == '×' || pre == '/')
	 * 2. post == 's' <<< post == '' <<< post == '%'
	 * 3. pre == '' <<< pre != ''

	 * Possible prefixes: '', '+', '×', '/'
	 * Possible postfixes: '', '%', 's'

	 * This ordering makes it so that all multiplicative pairs appear last (most
	 * unlikely to be a base value). Then, a value with seconds comes before a
	 * value without an unit which comes before a percentage value. Finally, a
	 * empty prefix is more likely to be a base value than a non-empty one.
	 *
	 * The comparator is stable, that is it returns the pair with the smaller index if they are equal.
	 * @param {{index: number, prefix: string, postfix: string}} a first prefix-postfix par
	 * @param {{index: number, prefix: string, postfix: string}} b second prefix-postfix par
	 * @returns {number} -1 if a comes before b, 1 if b comes before a and 0 otherwise.
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

	/**
	 * Applies the value of the given upgrade effect to the number of the given effect.
	 * @param {leiminauts.effect.NumericEffect} effect
	 * @param {leiminauts.effect.NumericEffect} upgradeEffect
	 */
	var applyUpgradeToEffect = function(effect, upgradeEffect) {
		if (upgradeEffect.prefix === "@") {
			return; // Do nothing because base is fixed
		}

		var number = effect.number;
		var value = upgradeEffect.number.value();

		if (!effect.isRelative() && upgradeEffect.isRelative()) {
			// Adapt value to reflect relative calculation to base
			value = value.divide(100);
		}

		if (upgradeEffect.prefix === "×") {
			number.multiplyStacking(value);
		} else if (upgradeEffect.prefix === "/") {
			number.divideStacking(value);
		} else if (!effect.isRelative() && upgradeEffect.isRelative()) {
			// Turn the relative calculation into an absolute multiplier
			// x - 25% = x * (1 - 25/100) = x * (- 25/100 + 1)
			number.multiplyStacking(value.add(1));
		} else {
			number.addStacking(value);
		}
	};

	return mergeEffects;
})();
