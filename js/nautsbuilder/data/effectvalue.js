/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

// TODO: rename to EffectNumber
leiminauts = leiminauts || {};
leiminauts.EffectNumber = function(number) {
  this.baseValue = Number(number);
  if (Number.isNaN(this.baseValue)) {
    console.log("Warning: " + number + " is not a number.");
  }

  this.additiveValues = [];
  this.multiplicativeValues = [];
  this.multipliers = [];
}

leiminauts.EffectNumber.prototype.toNumber = function(value) {
  var number = Number(value);
  if (Number.isNaN(number)) {
    console.log("Warning: " + value + " is not a number."); //FIXME: duplicate
  }
  return number;
}

leiminauts.EffectNumber.prototype.addRelativeAdditive = function(num) {
  var number = this.toNumber(num);
  var absolute = this.baseValue * number;
  this.addAbsoluteAdditive(absolute);
}

leiminauts.EffectNumber.prototype.addAbsoluteAdditive = function(num) {
  var number = this.toNumber(num);
  this.additiveValues.push(number);
}

leiminauts.EffectNumber.prototype.addMultiplicative = function(num) {
  var number = this.toNumber(num);
  this.multiplicativeValues.push(number);
}

leiminauts.EffectNumber.prototype.addMultiplier = function(num) {
  var number = this.toNumber(num);
  this.multipliers.push(number);
}

leiminauts.EffectNumber.prototype.clone = function() {
  var result = new leiminauts.EffectValue(this.baseValue);
  result.additiveValues = this.additiveValues.slice();
  result.multiplicativeValues = this.multiplicativeValues.slice();
  result.multipliers = this.multipliers.slice();
  return result;
}

leiminauts.EffectNumber.prototype.value = function() {
  // value = (base + additives + ...) * (1 + multiplicatives + ...) * multipliers * ...
  var additives = leiminauts.utils.sum(this.additiveValues);
  var multiplicatives = leiminauts.utils.sum(this.multiplicativeValues);
  var multipliers = leiminauts.utils.prod(this.multipliers);
  return (this.baseValue + additives) * (1 + multiplicatives) * multipliers;
}

leiminauts.EffectValue.prototype.toString = function effectValueToString() {
  return this.value().toString();
}
