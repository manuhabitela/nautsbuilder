/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

leiminauts = leiminauts || {};
leiminauts.effectnumber = leiminauts.effectnumber || {};

leiminauts.effectnumber.ensureNumber = function(value) {
  if (value instanceof leiminauts.effectnumber.EffectNumber) {
    return value;
  }

  var number = Number(value);
  if (Number.isNaN(number)) {
    console.log("Warning: " + value + " is not a number."); //FIXME: duplicate
  }
  return number;
}
leiminauts.effectnumber.getNumber = function(value) {
  if (value instanceof leiminauts.effectnumber.EffectNumber) {
    return value.getValue();
  } else {
    return value;
  }
}

leiminauts.effectnumber.EffectNumber = function(number) {
  this.baseNumber = leiminauts.effectnumber.ensureNumber(number);

  this.absoluteAdditives = [];
  this.relativeAdditives = [];
  this.multiplicatives = [];
  this.multipliers = [];
}

leiminauts.effectnumber.EffectNumber.prototype.getValue = function() {
  var base = leiminauts.effectnumber.getNumber(this.baseNumber);
  var relativeAdditives = _.chain(this.getRelativeAdditives()).map(leiminauts.effectnumber.getNumber).sum().value();
  var absoluteAdditives = _.chain(this.getAbsoluteAdditives()).map(leiminauts.effectnumber.getNumber).sum().value();
  var multiplicatives = _.chain(this.getMultiplicatives()).map(leiminauts.effectnumber.getNumber).sum().value();
  var multipliers = _.chain(this.getMultipliers()).map(leiminauts.effectnumber.getNumber).prod().value();

  return (base * (1 + relativeAdditives) + absoluteAdditives) * (1 + multiplicatives) * multipliers;
}

leiminauts.effectnumber.EffectNumber.prototype.getRelativeAdditives = function() {
  return this.relativeAdditives;
}

leiminauts.effectnumber.EffectNumber.prototype.getAbsoluteAdditives = function() {
  return this.absoluteAdditives;
}

leiminauts.effectnumber.EffectNumber.prototype.getMultiplicatives = function() {
  return this.multiplicatives;
}

leiminauts.effectnumber.EffectNumber.prototype.getMultipliers = function() {
  return this.multipliers;
}

leiminauts.effectnumber.EffectNumber.prototype.toString = function() {
  return this.getValue().toString();
}

leiminauts.effectnumber.EffectNumber.prototype.addRelativeAdditive = function(num) {
  var number = leiminauts.effectnumber.ensureNumber(num);
  this.relativeAdditives.push(number);
  return this;
}

leiminauts.effectnumber.EffectNumber.prototype.addAbsoluteAdditive = function(num) {
  var number = leiminauts.effectnumber.ensureNumber(num);
  this.absoluteAdditives.push(number);
  return this;
}

leiminauts.effectnumber.EffectNumber.prototype.addMultiplicative = function(num) {
  var number = leiminauts.effectnumber.ensureNumber(num);
  this.multiplicatives.push(number);
  return this;
}

leiminauts.effectnumber.EffectNumber.prototype.addMultiplier = function(num) {
  var number = leiminauts.effectnumber.ensureNumber(num);
  this.multipliers.push(number);
  return this;
}


leiminauts.effectnumber.ExtendedEffectNumber = function(baseEffectNumber) {
  leiminauts.effectnumber.EffectNumber.call(this, baseEffectNumber.baseNumber);
  this.base = baseEffectNumber;
}

leiminauts.effectnumber.ExtendedEffectNumber.prototype = Object.create(leiminauts.effectnumber.EffectNumber.prototype);
leiminauts.effectnumber.ExtendedEffectNumber.prototype.constructor = leiminauts.effectnumber.ExtendedEffectNumber;

leiminauts.effectnumber.ExtendedEffectNumber.prototype.getRelativeAdditives = function() {
  return this.base.getRelativeAdditives().concat(this.relativeAdditives);
}

leiminauts.effectnumber.ExtendedEffectNumber.prototype.getAbsoluteAdditives = function() {
  return this.base.getAbsoluteAdditives().concat(this.absoluteAdditives);
}

leiminauts.effectnumber.ExtendedEffectNumber.prototype.getMultiplicatives = function() {
  return this.base.getMultiplicatives().concat(this.multiplicatives);
}

leiminauts.effectnumber.ExtendedEffectNumber.prototype.getMultipliers = function() {
  return this.base.getMultipliers().concat(this.multipliers);
}
