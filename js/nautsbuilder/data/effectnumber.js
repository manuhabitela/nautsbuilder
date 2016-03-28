/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

// TODO: make part of 'leiminauts.effect' namespace
leiminauts = leiminauts || {};
leiminauts.ensureNumber = function(value) {
  if (value instanceof leiminauts.EffectNumber) {
    return value;
  }

  var number = Number(value);
  if (Number.isNaN(number)) {
    console.log("Warning: " + value + " is not a number."); //FIXME: duplicate
  }
  return number;
}
leiminauts.getNumber = function(value) {
  if (value instanceof leiminauts.EffectNumber) {
    return value.getValue();
  } else {
    return value;
  }
}

leiminauts.EffectNumber = function(number) {
  this.baseNumber = leiminauts.ensureNumber(number);

  this.absoluteAdditives = [];
  this.relativeAdditives = [];
  this.multiplicatives = [];
  this.multipliers = [];
}

leiminauts.EffectNumber.prototype.getValue = function() {
  var base = leiminauts.getNumber(this.baseNumber);
  var relativeAdditives = _.chain(this.getRelativeAdditives()).map(leiminauts.getNumber).sum().value();
  var absoluteAdditives = _.chain(this.getAbsoluteAdditives()).map(leiminauts.getNumber).sum().value();
  var multiplicatives = _.chain(this.getMultiplicatives()).map(leiminauts.getNumber).sum().value();
  var multipliers = _.chain(this.getMultipliers()).map(leiminauts.getNumber).prod().value();

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

leiminauts.EffectNumber.prototype.addRelativeAdditive = function(num) {
  var number = leiminauts.ensureNumber(num);
  this.relativeAdditives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addAbsoluteAdditive = function(num) {
  var number = leiminauts.ensureNumber(num);
  this.absoluteAdditives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addMultiplicative = function(num) {
  var number = leiminauts.ensureNumber(num);
  this.multiplicatives.push(number);
  return this;
}

leiminauts.EffectNumber.prototype.addMultiplier = function(num) {
  var number = leiminauts.ensureNumber(num);
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
