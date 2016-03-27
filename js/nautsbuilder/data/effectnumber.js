/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

// TODO: rename to EffectNumber
leiminauts = leiminauts || {};
leiminauts.EffectNumber = function(number) {
  this.baseNumber = Number(number);
  if (Number.isNaN(this.baseNumber)) {
    console.log("Warning: " + number + " is not a number."); //FIXME: duplicate
  }

  this.absoluteAdditives = [];
  this.relativeAdditives = [];
  this.multiplicatives = [];
  this.multipliers = [];
}

leiminauts.EffectNumber.prototype.getValue = function() {
  var base = this.baseNumber;
  var relativeAdditives = leiminauts.utils.sum(this.getRelativeAdditives());
  var absoluteAdditives = leiminauts.utils.sum(this.getAbsoluteAdditives());
  var multiplicatives = leiminauts.utils.sum(this.getMultiplicatives());
  var multipliers = leiminauts.utils.prod(this.getMultipliers());

  return (base * (1 + relativeAdditives) + absoluteAdditives) * (1 + multiplicatives) * multipliers;
}

leiminauts.EffectNumber.prototype.getRelativeAdditives = function() {
  return this.relativeAdditives;
}

leiminauts.EffectNumber.prototype.getAbsoluteAdditives = function() {
  return this.absoluteAdditives;
}

leiminauts.EffectNumber.prototype.getMultiplicatives = function() {
  return this.multiplicatives;
}

leiminauts.EffectNumber.prototype.getMultipliers = function() {
  return this.multipliers;
}

leiminauts.EffectNumber.prototype.toString = function() {
  return this.getValue().toString();
}


leiminauts.EffectNumber.prototype.toNumber = function(value) { // Move to utils?
  var number = Number(value);
  if (Number.isNaN(number)) {
    console.log("Warning: " + value + " is not a number."); //FIXME: duplicate
  }
  return number;
}

leiminauts.EffectNumber.prototype.addRelativeAdditive = function(num) {
  var number = this.toNumber(num);
  this.relativeAdditives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addAbsoluteAdditive = function(num) {
  var number = this.toNumber(num);
  this.absoluteAdditives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addMultiplicative = function(num) {
  var number = this.toNumber(num);
  this.multiplicatives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addMultiplier = function(num) {
  var number = this.toNumber(num);
  this.multipliers.push(number);
  return this;
}


leiminauts.ExtendedEffectNumber = function(baseEffectNumber) {
  leiminauts.EffectNumber.call(this, baseEffectNumber.baseNumber);
  this.base = baseEffectNumber;
}

leiminauts.ExtendedEffectNumber.prototype = Object.create(leiminauts.EffectNumber.prototype);
leiminauts.ExtendedEffectNumber.prototype.constructor = leiminauts.ExtendedEffectNumber;

leiminauts.ExtendedEffectNumber.prototype.getRelativeAdditives = function() {
  return this.base.getRelativeAdditives().concat(this.relativeAdditives);
}

leiminauts.ExtendedEffectNumber.prototype.getAbsoluteAdditives = function() {
  return this.base.getAbsoluteAdditives().concat(this.absoluteAdditives);
}

leiminauts.ExtendedEffectNumber.prototype.getMultiplicatives = function() {
  return this.base.getMultiplicatives().concat(this.multiplicatives);
}

leiminauts.ExtendedEffectNumber.prototype.getMultipliers = function() {
  return this.base.getMultipliers().concat(this.multipliers);
}
