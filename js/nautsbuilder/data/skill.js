/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

/**
 * THIS is the messy part.
 */
leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.set('upgrades', new leiminauts.Upgrades());
		this.upgrades = this.get('upgrades');

		this.on('change:selected', this.onSelectedChange, this);
	},

	onSelectedChange: function() {
		if (this.get('selected')) {
			this.upgrades.on('change', this.updateEffects, this);
			this.on('change:active', this.updateEffects, this);
			this.on('change:active', this.resetUpgradesState, this);
		} else {
			this.upgrades.off('change', this.updateEffects, this);
			this.off('change:active', this.updateEffects, this);
			this.off('change:active', this.resetUpgradesState, this);
		}

		//first initialization of the skill: activating upgrades and shit
		if (this.get('selected') && this.get('upgrades').length <= 0) {
			this.set('maxed_out', false);
			this._originalEffects = this.get('effects');
			this.prepareBaseEffects();
			this.initUpgrades();
			this.set('total_cost', 0);
			this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
			this.set('toggable', !this.get('active'));
		}
	},

	initUpgrades: function() {
		var skillUpgrades = [];
		//the jump skill has common upgrades, but also some custom ones sometimes
		if (this.get('type') == "jump") {
			skillUpgrades = _(leiminauts.upgrades).where({ skill: "Jump" });
			//some chars have turbo pills, others have light, others have companion; we remove the ones unused
			var jumpEffects = leiminauts.utils.treatEffects(this.get('effects'));
			var pills = _(jumpEffects).findWhere({key: "pills"});
			var unwantedPills = [];
			if (pills && pills.value == "light")
				unwantedPills = ["Power Pills Turbo", "Power Pills Companion"];
			else if (pills && pills.value == "companion")
				unwantedPills = ["Power Pills Light", "Power Pills Turbo"];
			else
				unwantedPills = ["Power Pills Light", "Power Pills Companion"];
			_(unwantedPills).each(function(pill) {
				skillUpgrades.splice( _(skillUpgrades).indexOf( _(skillUpgrades).findWhere({ name: pill }) ), 1 );
			});

			var effects = leiminauts.utils.treatEffects(this._originalEffects);
			effects.splice( _(effects).indexOf( _(effects).findWhere({ key: 'pills' }) ), 1 );

			//some chars have unique jump upgrades that replace common ones
			var customJumpUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(skillUpgrades).each(function(upgrade, i) {
				_(customJumpUpgrades).each(function(jupgrade) {
					if (jupgrade.replaces == upgrade.name)
						skillUpgrades[i] = _(jupgrade).clone();
				});
			});
		} else {
			skillUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(skillUpgrades).each(function(upgrade) {
				upgrade.skill = this;
			}, this);
		}
		this.get('upgrades').reset(skillUpgrades);
		this.resetUpgradesState();
	},

	setActive: function(active) {
		if (this.get('toggable'))
			this.set('active', !!active);
	},

	resetUpgradesState: function(active) {
		active = active !== undefined ? active : !this.get('active');
		this.upgrades.each(function(upgrade) {
			upgrade.setStep(0);
			upgrade.set('locked', active);
		}, this);
		this.set('maxed_out', false);
	},

	getActiveUpgrades: function() {
		var activeUpgrades = this.upgrades.filter(function(upgrade) {
			return upgrade.get('active') === true;
		});
		return activeUpgrades;
	},

	getActiveSteps: function() {
		var activeSteps = [];
		this.upgrades.each(function(upgrade) {
			if (upgrade.get('active') === true) {
				activeSteps.push(upgrade.get('current_step'));
			}
		});
		return activeSteps;
	},

	updateEffects: function(e) {
		if (!this.get('selected')) {
			return false;
		}
		
		if (!this.get('active')) {
			this.set('effects', []);
			this.set('total_cost', 0);
			return false;
		}
		
		var activeUpgrades = this.getActiveUpgrades();
		this.set('total_cost', this.getTotalCost(activeUpgrades));
		this.set('maxed_out', this.skillIsMaxedOut(activeUpgrades));		
		this.lockNonActiveUpgrades(this.upgrades, activeUpgrades);
		
		var activeSteps = this.getActiveSteps();		
		this.set('effects', [], {silent: true});
		var effects = this.mergeEffects(this.get('baseEffects'), activeSteps);
		this.applyUpgrades(effects);
		
		this.setSpecificEffects();
		this.setDPS();
		this.setSpecificEffectsTheReturnOfTheRevenge();
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key.toLowerCase(); }));
	},
	
	skillIsMaxedOut: function(activeUpgrades) {
		var maxedOut = true;
		if (activeUpgrades.length >= 3) {
			_(activeUpgrades).each(function(upgrade) {
				if (upgrade.get('current_step').get('level') !== upgrade.get('max_step')) {
					maxedOut = false;
					return false;
				}
			});
		} else {
			maxedOut = false;
		}
		return maxedOut;
	},
	
	lockNonActiveUpgrades: function(upgrades, activeUpgrades) {
		// Make all none active upgrades locked if 3 upgrades are active		
		upgrades.each(function(upgrade) {
			upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		});
	},

	getTotalCost: function(activeUpgrades) {
		var cost = parseInt(this.get('cost'), 10);
		// Update total skill cost
		_(activeUpgrades).each(function(upgrade) {
			cost += upgrade.get('current_step').get('level') * upgrade.get('cost');
		});
		return cost;		
	},

	mergeEffects: function(baseEffects, activeSteps) {		
		var effects = {};		
		
		// Combine all effects with the name key into an array of values
		var addToEffects = function(attributesList) {
			_(attributesList).each(function(attr) {			
				if (effects[attr.key] === undefined) {
					effects[attr.key] = [ attr.value ];
				}
				else {
					effects[attr.key].push(attr.value);
				}
			});
		};
		
		addToEffects(baseEffects);
		_(activeSteps).each(function(step) {
			addToEffects(step.get('attrs'))
		});
		
		// Sort each array so that divison values always come last
		_(effects).each(function(arr, key, map) {
			map[key].sort(function(left, right) {
				var leftIsDivison = left.toString().charAt(0) == "/";
				var rightIsDivison = right.toString().charAt(0) == "/";
			
				// If they are not the same type, return the one with divison
				// Otherwise, don't sort
				if (leftIsDivison !== rightIsDivison) {
					return leftIsDivison;
				}
				else {
					return false;
				}
			});
		});
		
		return effects;
	},
	
	applyUpgrades: function(effects) {
		var upgradeRegex = /^(\+|-|\/|@)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		
		_(effects).each(function(upgrades, key) {			
			var baseUpgrade = String(upgrades[0]);			
			var effect;
			var effectNumber = 0;
			
			// Merge all upgrades into one effect
			_(upgrades).each(function(upgrade) {
				var regexResult = upgradeRegex.exec(upgrade);
				var result = this.applyUpgrade(upgrade, regexResult, effectNumber, baseUpgrade);
				effect = result[0];
				effectNumber = result[1];
			}, this);
		
			this.get('effects').push({"key": key, value: effect});
		}, this);
	},

	applyUpgrade: function(upgrade, regexResult, effectNumber, baseUpgrade) {
		var baseIsPercent = baseUpgrade.charAt(baseUpgrade.length-1) == "%";
		var baseIsRelative = baseUpgrade.charAt(0) == "+";
		
		var effect;
		var effectNumber;
		
		if (regexResult === null) {
			effect = upgrade;			
		}
		else {
			var upgradeNumber = parseFloat(regexResult[2]);
		
			var operation;
			if (regexResult[3] && regexResult[3] == "%" && !baseIsPercent) {
				operation = "%";
			}
			else if (regexResult[1] && regexResult[1] == "/") {
				operation = "/";
			}
			else if (regexResult[1] && regexResult[1] == "@") {
				operation = "@";
			}
			else if (regexResult[1] && regexResult[1] == "-") {
				upgradeNumber = -upgradeNumber;
			}
			
			effectNumber = this.applyOperation(effectNumber, upgradeNumber, operation);
   
			effect = (baseIsRelative ? regexResult[1] : "");			 
			effect += leiminauts.utils.number(effectNumber);
			if (regexResult[3] && (regexResult[3] == "s" || baseIsPercent)) {
				effect += regexResult[3];
			}
		}
		
		return [effect, effectNumber];
	},
	
	applyOperation: function(number, operand, operation) {
		operation = operation || "";
		
		if (operation == "%") {
			number *= 1 + operand/100;
		}
		else if (operation == "/") {
			number /= operand;
		}
		else if (operation == "@") {
			number = operand;
		}
		else {
			number += operand;
		}
		
		return number;
	},

	prepareBaseEffects: function() {
		if (!this.get('selected')) return false;
		if (!_(this.get('effects')).isString())
			return false;
		this.set('baseEffects', leiminauts.utils.treatEffects(this.get('effects')));
		if (this.get('type') == "jump") {
			var effects = _(this.get('baseEffects'));
			effects.splice( _(effects).indexOf( _(effects).findWhere({ key: 'pills' }) ), 1 );
			var solar = effects.findWhere({key: "solar"});
			var solarPerMin = effects.findWhere({key: "solar per min"});
			if (!solar)
				effects.push({key: "solar", value: 235});
			if (!solarPerMin)
				effects.push({key: "solar per min", value: 30});
		}
	},

	setSpecificEffects: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		var avgDmg = 0;
		var dmg = 0;

		var bonusesDmg = [];
		if (this.get('name') == "Bolt .45 Fish-gun") {
			bonusesDmg.push('bonus damage');
		}

		if (this.get('name') == "Bubble Gun") {
			bonusesDmg.push('yakoiza damage', 'godfish damage');
		}

		if (this.get('name') == "Chain whack") {
			bonusesDmg.push('ion blowtorch damage');
		}

		_(bonusesDmg).each(function(bonus) {
			var bonusDmg = effects.findWhere({key: bonus});
			if (bonusDmg) {
				bonusDmgVal = this.bonusDamage(effects.findWhere({key: "damage"}), bonus, effects);
				bonusDmg.value = bonusDmgVal;
			}
		}, this);

		if (this.get('name') == "Missiles") {
			var missilesSequence = [];
			var baseDamage = parseInt(effects.findWhere({key: "damage"}).value, 10);
			_(4).times(function() { missilesSequence.push(baseDamage); });
			var missiles = effects.filter(function(effect) {
				return (/^missile [0-9]$/).test(effect.key);
			});
			_(missiles).each(function(missile) {
				var number = parseInt(missile.key.substr(-1), 10)-1;
				missilesSequence[number] = (baseDamage + (4*number))*parseInt(missile.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: missile.key }) ), 1 );
			});
			while ((missilesSequence.length > 1) && (missilesSequence[missilesSequence.length-1] == baseDamage))
				missilesSequence.pop();
			avgDmg = _(missilesSequence).reduce(function(memo, num){ return memo + num; }, 0) / missilesSequence.length;
			effects.findWhere({key: "damage"}).value = missilesSequence.join(' > ');
			if (missilesSequence.length !== 1 && avgDmg !== missilesSequence[0])
				effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}

		if (this.get('name') == "Bash") {
			var punchsSequence = _(this.get('baseEffects')).findWhere({key:"damage"}).value.split(' > ');
			var punchs = effects.filter(function(effect) {
				return (/^punch [0-9]$/).test(effect.key);
			});
			_(punchs).each(function(punch) {
				var number = parseInt(punch.key.substr(-1), 10)-1;
				punchsSequence[number] = punchsSequence[number]*1 + parseInt(punch.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: punch.key }) ), 1 );
			});

			avgDmg = _(punchsSequence).reduce(function(memo, num){ return memo + num*1; }, 0) / punchsSequence.length;
			effects.findWhere({key: "damage"}).value = punchsSequence.join(' > ');
			effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}

		if (this.get('name') == "Slash") {
			var clover = this.getActiveUpgrade("clover of honour");
			var backstab = this.getActiveUpgrade("backstab blade");
			var backstabDmg, bsEffect;
			dmg = effects.findWhere({key: "damage"});

			if (backstab) {
				backstabDmg = this.bonusDamage(dmg, "backstab damage", effects);
				bsEffect = effects.findWhere({key: "backstab damage"});
				if (bsEffect) bsEffect.value = backstabDmg;
			}

			if (clover) {
				cloverDmg = this.bonusDamage(dmg, "3rd hit damage", effects);
				avgDmg = (dmg.value*2+cloverDmg)/3;
				dmg.value = [dmg.value*1, dmg.value*1, cloverDmg].join(' > ');
				effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});

				if (backstab && bsEffect) {
					cloverDmgBs = this.bonusDamage(backstabDmg, "3rd hit damage", effects);
					bsEffect.value = [backstabDmg*1, backstabDmg*1, cloverDmgBs].join(' > ');
					backstabDmg = (backstabDmg*2+cloverDmgBs)/3;
					effects.push({key: "avg backstab damage", value: leiminauts.utils.number(backstabDmg)});
				}

				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "3rd hit damage" }) ), 1 );
			}
		}

		//monkey's avg dps and max dps. Avg dps is the dps including all charges but the last one.
		if (this.get('name') == "Laser") {
			var minDamage = effects.findWhere({key: "damage"}).value;
			var maxDamage = effects.findWhere({key: "max damage"}).value;
			var steps = [];
			_(maxDamage - minDamage).times(function(i) { steps.push(i+minDamage); });
			var attackPerSecond = effects.findWhere({key: "attack speed"}).value/60;
			var tickPerSecond = effects.findWhere({key: "time to next charge"}).value.replace('s', '')*1;
			var stepAttackPerSecond = attackPerSecond*tickPerSecond;
			var time = 0;
			dmg = 0;
			_(steps).each(function(step) {
				dmg += stepAttackPerSecond*step;
				time += tickPerSecond;
			});
			var avgDPS = dmg/time;
			effects.push({key: "DPS until max", value: leiminauts.utils.number(avgDPS)});
			effects.push({key: "DPS max", value: leiminauts.utils.number(attackPerSecond*maxDamage)});
		}

		if (this.get('name') == "Spike Dive") {
			dmg = effects.findWhere({key: "damage"}).value;
			var seahorse = this.getActiveUpgrade("dead seahorse head");
			var seahorseEffect = null;
			var seahorsePercent = effects.findWhere({key: "extra spike damage"});
			seahorsePercent = seahorsePercent ? parseInt(seahorsePercent.value, 10) : null;
			if (seahorse && seahorsePercent) {
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "extra spike" }) ), 1 );
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "extra spike damage" }) ), 1 );
				seahorseEffect = {key: "Extra Spike", value: dmg*seahorsePercent/100 };
				effects.push(seahorseEffect);
			}

			var goldfish = this.getActiveUpgrade("bag full of gold fish");
			var goldfishEffect = effects.findWhere({key: "damage with 150 solar"});
			if (goldfish && goldfishEffect) {
				goldfishEffect.value = goldfishEffect.value*1 + dmg;
				if (seahorseEffect) {
					effects.push({key: "Extra Spike With 150 Solar", value: Math.floor(goldfishEffect.value*seahorsePercent/100)});
				}
			}
		}

		if (this.get('name') == "Evil Eye") {
			var toothbrush = this.getActiveUpgrade("toothbrush shank");
			if (toothbrush) {
				dmg = _(this.get('baseEffects')).findWhere({key:"damage"}).value.split(' > ');
				toothbrushVal = toothbrush.get('current_step').get('level') > 0 ? toothbrush.get('current_step').get('attrs') : null;
				if (toothbrushVal) {
					var percentToAdd = parseInt(_(toothbrushVal).findWhere({key: "damage"}).value, 10);
					var newDmg = [];
					_(dmg).each(function(val) {
						newDmg.push(((val*1)/100*(percentToAdd*1))+val*1);
					});
					effects.findWhere({key: "damage"}).value = newDmg.join(' > ');
				}
			}
		}
	},

	setDPS: function() {
		if (!this.get('selected')) return false;
		if (this.get('name') == "Laser") return false; //dps is set in specifics for the laser

		var effects = _(this.get('effects'));

		//normal DPS
		var attackSpeed = effects.findWhere({key: "attack speed"});
		var damage = effects.findWhere({key: "avg damage"});
		if (!damage) damage = effects.findWhere({key: "damage"});
		var dps = effects.findWhere({key: "DPS"});
		if (attackSpeed && damage) {
			dpsVal = leiminauts.utils.dps(damage.value, attackSpeed.value);
			if (dps) dps.value = dpsVal;
			else {
				dps = {key: "DPS", value: dpsVal};
				effects.push(dps);
			}
		}

		//dot DPS
		var dot = effects.findWhere({key: "damage over time"});
		var dotDuration = effects.findWhere({key: "damage duration"});
		if (dot && dotDuration) {
			effects.push({ key: "DOT DPS", value: leiminauts.utils.number(dot.value/dotDuration.value.replace('s', '')) });
		}

		if (this.get('type') === "auto") {
			//"bonus" DPS
			//we look for any bonus dps activated. A "bonus dps" is generally given from an upgrade of the AA (lonestar missiles, coco conductor, etc)
			//couple of effects like "missile damage" and "missile attack speed" represents a "bonus dps" that can be calculated
			//if one part is not detected (ie we have a "missile damage" effect but no "missile attack speed") we take default attack speed and vice versa
			//"Bonus Damage" or "Avg damage" are usually not calculated
			var bonusCheck = { "damage": [], "attackSpeed": [] };
			var deniedBonusWords = ["storm", "bonus", "avg", "turret", "yakoiza", "grenade", "snipe", "min", "max", "droid"];
			effects.each(function(e) {
				var denied = false;
				_(deniedBonusWords).each(function(word) { if (e.key.toLowerCase().indexOf(word) === 0) { denied = true; }});
				if (denied) return false;
				var specificDmg = (e.key).match(/(.+) damage/i);
				var specificAS = (e.key).match(/(.+) attack speed/i);
				if (specificDmg) bonusCheck.damage.push(specificDmg[1]);
				if (specificAS)	bonusCheck.attackSpeed.push(specificAS[1]);
			});
			var totalDPS = dps ? +dps.value : 0;
			var bonus = _.union(bonusCheck.damage, bonusCheck.attackSpeed); //in our example, contains "missile"
			_(bonus).each(function(i) {
				var dmgEffect;
				if (effects.findWhere({key: "avg " + i + " damage"}))
					dmgEffect = effects.findWhere({key: "avg " + i + " damage"});
				else
					dmgEffect = effects.findWhere({key: i + " damage"}) ? effects.findWhere({key: i + " damage"}) : effects.findWhere({key: "damage"});
				var asEffect = effects.findWhere({key: i + " attack speed"}) ? effects.findWhere({key: i + " attack speed"}) : effects.findWhere({key: "attack speed"});
				var itemBonus = {key: i + " DPS", value: leiminauts.utils.dps( dmgEffect.value, asEffect.value )};
				totalDPS += +itemBonus.value;
				effects.push(itemBonus);
			});
			if (bonus.length && dps && totalDPS !== dps.value && !_(['Slash', 'Bubble Gun', 'Chain whack']).contains(this.get('name')))
				effects.push({key: "total DPS", value: leiminauts.utils.number(totalDPS) });
		}
	},

	//set specifics effects after DPS calculation
	setSpecificEffectsTheReturnOfTheRevenge: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		
		var obj = this
		effects.each(function(effect) {
			var result = (effect.key).match(/(.*)damage multiplier/i);			
			if (result && effect.value) {
				effects.splice(effects.indexOf(effect), 1);
				obj.multiplyDamage(effect.value, effects, result[1]);
				
				if (obj.get('name') == "Bubble Gun") {
					obj.multiplyDamage(effect.value, effects, "godfish ");
					obj.multiplyDamage(effect.value, effects, "yakoiza ");
				}
			}
		});
	},

	multiplyDamage: function(times, effects, prefix) {
		prefix = prefix || "";
		var damage = effects.findWhere({key: prefix + "damage"});
		var dps = effects.findWhere({key: prefix + "DPS"});
		// if (damage) damage.value = damage.value + "&nbsp; ( " + leiminauts.utils.number(damage.value*times) + " )";
		// if (dps) dps.value = dps.value + "&nbsp; ( " + leiminauts.utils.number(dps.value*times) + " )";
		if (damage) damage.value = leiminauts.utils.number(damage.value*times) + "&nbsp; ( " + damage.value + "×" + times + " )";
		if (dps) dps.value = leiminauts.utils.number(dps.value*times) + "&nbsp; ( " + dps.value + "×" + times + " )";
	},

	bonusDamage: function(baseDmg, effect, effects) {
		var dmg = baseDmg && baseDmg.value ? baseDmg.value : baseDmg;
		var eff = effects.findWhere({key: effect});
		eff = eff ? eff.value : 0;
		return dmg + eff*1;
	},

	getActiveUpgrade: function(name) {
		var upgrade = _(this.getActiveUpgrades()).filter(function(upg) { return upg.get('name').toLowerCase() == name.toLowerCase(); });
		if (upgrade.length) return upgrade[0]; else return false;
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});
