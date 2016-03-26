/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

// TODO: rename to EffectNumber
leiminauts = leiminauts || {};
leiminauts.EffectValue = function(baseValue) {
  this.baseValue = Number(baseValue);
  if (Number.isNaN(this.baseValue)) {
    console.log("Warning: " + baseValue + " is not a number.");
  }

  this.additiveValues = [];
  this.multiplicativeValues = [];
  this.multipliers = [];
}

leiminauts.EffectValue.prototype.toNumber = function(value) {
  var result = Number(value);
  if (Number.isNaN(result)) {
    console.log("Warning: " + value + " is not a number."); //FIXME: duplicate
  }
  return result;
}

leiminauts.EffectValue.prototype.addRelativeAdditive = function(num) {
  var number = this.toNumber(num);
  var absolute = this.baseValue * number;
  this.addAbsoluteAdditive(absolute);
}

leiminauts.EffectValue.prototype.addAbsoluteAdditive = function(num) {
  var number = this.toNumber(num);
  this.additiveValues.push(number);
}

leiminauts.EffectValue.prototype.addMultiplicative = function(num) {
  var number = this.toNumber(num);
  this.multiplicativeValues.push(number);
}

leiminauts.EffectValue.prototype.addMultiplier = function(num) {
  var number = this.toNumber(num);
  this.multipliers.push(number);
}

leiminauts.EffectValue.prototype.clone = function() {
  var result = new leiminauts.EffectValue(this.baseValue);
  result.additiveValues = this.additiveValues.slice();
  result.multiplicativeValues = this.multiplicativeValues.slice();
  result.multipliers = this.multipliers.slice();
  return result;
}

leiminauts.EffectValue.prototype.value = function() {
  // value = (base + additives + ...) * (1 + multiplicatives + ...) * multipliers * ...
  var additives = leiminauts.utils.sum(this.additiveValues);
  var multiplicatives = leiminauts.utils.sum(this.multiplicativeValues);
  var multipliers = leiminauts.utils.prod(this.multipliers);
  return (this.baseValue + additives) * (1 + multiplicatives) * multipliers;
}

leiminauts.EffectValue.prototype.toString = function effectValueToString() {
  return this.value().toString();
}
