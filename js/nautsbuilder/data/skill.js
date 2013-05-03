/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
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
			this._originalEffects = this.get('effects');
			this.prepareBaseEffects();
			this.initUpgrades();
			this.set('totalCost', 0);
			this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
			this.set('toggable', !this.get('active'));
		}
	},

	initUpgrades: function() {
		var skillUpgrades = [];
		//the jump skill has common upgrades, but also some custom ones sometimes
		if (this.get('type') == "jump") {
			skillUpgrades = _(leiminauts.upgrades).where({ skill: "Jump" });
			//some chars have turbo pills, others have light; we remove the one unused
			var jumpEffects = leiminauts.utils.treatEffects(this.get('effects'));
			var pills = _(jumpEffects).findWhere({key: "pills"});
			var unwantedPills = "Power Pills Light";
			if (pills && pills.value == "light") {
				unwantedPills = "Power Pills Turbo";
			}
			skillUpgrades.splice( _(skillUpgrades).indexOf( _(skillUpgrades).findWhere({ name: unwantedPills }) ), 1 );

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
		if (!this.get('selected')) return false;
		if (!this.get('active')) {
			this.set('effects', []);
			this.set('totalCost', 0);
			return false;
		}
		var activeUpgrades = this.getActiveUpgrades();
		var activeSteps = this.getActiveSteps();
		this.upgrades.each(function(upgrade) {
			if (this.get('active'))
				upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		}, this);

		var cost = parseInt(this.get('cost'), 10);
		//update total skill cost
		_(activeUpgrades).each(function(upgrade) {
			cost += upgrade.get('current_step').get('level')*upgrade.get('cost');
		});
		this.set('totalCost', cost);

		//combine similar steps: some characters have upgrades that enhance similar things.
		// Ie Leon has 2 upgrades that add damages to its tong (1: +3/+6/+9 and 2: +9)
		//
		// this is KIND OF a mess
		// update 2nd of may 2013: THIS IS A BIG FREAKIN MESS. HOW DARE YOU. Sorry, future me.
		this.set('effects', [], {silent: true});
		var effects = {};
		var effectsAtEnd = [];
		var organizeEffects = function(attributesList) {
			_(attributesList).each(function(attr) {
				var val = attr.value;
				//if the effect concerns a division, it is put at the end of the array so that it divides the whole value
				if (attributesList !== effectsAtEnd && val.toString().charAt(0) == "/" && !_(parseFloat(val.substr(1))).isNaN())
					effectsAtEnd.push({key: attr.key, value: val});
				else {
					if (effects[attr.key] !== undefined)
						effects[attr.key].push(attr.value);
					else
						effects[attr.key] = [attr.value];
				}
			});
		};
		organizeEffects(this.get('baseEffects'));
		_(activeSteps).each(function(step, i) {
			organizeEffects(step.get('attrs'));
		});
		organizeEffects(effectsAtEnd);

		//for leon tong with max damage, our effects var now looks like: { "damage": ["+9", "+9"], "range": ["+2.4"], ...  }
		//we must combine effects values that looks like numbers so we have "damage": "+18",
		//without forgetting the possible "+", "-", "%", "/", "s"
		var effectRegex = /^(\+|-|\/)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		_(effects).each(function(values, key) {
			var effect = "";
			var oldEffect = false;
			_(values).each(function(value, i) {
				regexRes = effectRegex.exec(value);
				if (regexRes !== null) {
					var showUnit = true;
					var effectNumber = parseFloat(effect);
					if (_(effectNumber).isNaN()) effectNumber = 0;

					//if original value is %, we just += values. Otherwise (ie attack speed), we calculate the % based on original value
					if (regexRes[3] && regexRes[3] == "%" && effectNumber !== 0 && values[0].substr(-1) != "%") {
						effectNumber += parseFloat(values[0]) * (parseFloat(value)/100);
						showUnit = false;
					}
					//we divide if there is a "/"
					else if (regexRes[1] && regexRes[1] == "/") {
						effectNumber = effectNumber/parseFloat(value.substr(1));
					}
					else
						effectNumber += parseFloat(value, 10);
					effectNumber = leiminauts.utils.number(effectNumber);
					effect = effectNumber;
					if (regexRes[3] && showUnit) effect += regexRes[3];
					if (regexRes[1] && regexRes[1] == "+" && effectNumber > 0 && (!oldEffect || oldEffect.toString().indexOf('+') === 0))
						effect = "+" + effect;
				} else
					effect = value;
				oldEffect = effect;
			});
			this.get('effects').push({ "key": key, value: effect });
		}, this);
		this.setSpecificEffects();
		this.setDPS();
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key.toLowerCase(); }));
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
				effects.push({key: "solar", value: 200});
			if (!solarPerMin)
				effects.push({key: "solar per min", value: 30});
		}
	},

	setSpecificEffects: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		var avgDmg = 0;

		if (this.get('name') == "Missiles") {
			var missilesSequence = [];
			var baseDamage = effects.findWhere({key: "damage"}).value;
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

		//monkey's avg dps and max dps. Avg dps is the dps including all charges but the last one.
		if (this.get('name') == "Laser") {
			var minDamage = effects.findWhere({key: "damage"}).value;
			var maxDamage = effects.findWhere({key: "max damage"}).value;
			var steps = [];
			_(maxDamage - minDamage).times(function(i) { steps.push(i+minDamage); });
			var attackPerSecond = effects.findWhere({key: "attack speed"}).value/60;
			var tickPerSecond = effects.findWhere({key: "time to next charge"}).value.replace('s', '')*1;
			var stepAttackPerSecond = attackPerSecond*tickPerSecond;
			var dmg = 0; time = 0;
			_(steps).each(function(step) {
				dmg += stepAttackPerSecond*step;
				time += tickPerSecond;
			});
			var avgDPS = dmg/time;
			effects.push({key: "DPS until max", value: leiminauts.utils.number(avgDPS)});
			effects.push({key: "DPS max", value: leiminauts.utils.number(attackPerSecond*maxDamage)});
		}

		if (this.get('name') == "Spike Dive") {
			var seahorse = _(this.getActiveUpgrades()).filter(function(upg) { return upg.get('name') == "Dead Seahorse Head"; });
			if (seahorse.length) seahorse = seahorse[0]; else return false;
			var extraSpikeDmg = effects.findWhere({key: "damage"}).value/2;
			effects.push({key: "Extra Spike", value: leiminauts.utils.number(extraSpikeDmg)});
			effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "extra spike" }) ), 1 );
		}
	},

	setDPS: function() {
		if (!this.get('selected')) return false;
		if (this.get('name') == "Laser") return false; //dps is set in specifics for the laser
		var effects = _(this.get('effects'));
		var attackSpeed = effects.findWhere({key: "attack speed"});
		var damage = effects.findWhere({key: "avg damage"});
		if (!damage) damage = effects.findWhere({key: "damage"});
		var dps = effects.findWhere({key: "dps"});
		if (attackSpeed && damage) {
			var dpsVal = (parseFloat(attackSpeed.value, 10)/60*parseFloat(damage.value, 10)).toFixed(2);
			dpsVal = leiminauts.utils.number(dpsVal);
			if (dps) dps.value = dpsVal;
			else effects.push({key: "DPS", value: dpsVal});
		}
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});
