/* Nautsbuilder - Awesomenauts build maker v0.15.0 - https://github.com/Leimi/nautsbuilder
* Copyright (c) 2015 Emmanuel Pelletier
* This Source Code Form is subject to the terms of the Mozilla Public License, v2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. *//* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
_.mixin({
	//https://github.com/epeli/underscore.string
	//pass "a_string_like_this" and get "A String Like This"
	capitalized: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
	},
	//pass "A String like this" and get "A_String_like_this"
	underscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/[\s]+/g, '_');
	},

	//pass "A_string_Like_this" and get "A string Like this"
	ununderscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ');
	},

	//pass "A string\n\nlike this" and get "<p>A string</p><p>like this</p>"
	paragraphed: function(string) {
		if (!_.isString(string)) return false;
		return "<p>" + string.replace(/\n\n/g, "</p><p>") + "</p>";
	},

	//http://stackoverflow.com/questions/3000649/trim-spaces-from-start-and-end-of-string
	trim: function(string, characters) {
		if (!string) return '';
		characters = characters || null;
		if (typeof String.prototype.trim != 'function' || characters) {
			var pattern = characters ? characters : '\\s';
			return String(string).replace(new RegExp('^' + pattern + '+|' + pattern + '+$', 'g'), '');
		} else {
			return string.trim();
		}
	},

	//kinda markdown style: pass *this* and get <em>this</em>
	italics: function(string) {
		if (!string) return '';
		return string.replace(/\n/g, "<br>").replace(/\*(.*)\*/, '<em>$1</em>');
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

Backbone.Model.prototype.toJSON = function(options) {
	return _.extend({}, _.clone(this.attributes), { cid: this.cid });
};

window.leiminauts = window.leiminauts || {};

leiminauts.utils = {
	//takes a string like "damage: +2; crit chance: +15%" and returns an array like [{damage: "+2"}, {"crit chance": "+15%"}]
	treatEffects: function(effectsString) {
		var effects = [];
		if (!_(effectsString).isString()) return effectsString;
		var attributes = effectsString.toLowerCase().split(';');
		_(attributes).each(function(attr, i) {
			attribute = _(attr).trim().split(':');
			// [0] is the attribute (ex: "damage"), [1] is the value (ex: "+9")
			// we gently assume there is only one ":" in the string, otherwise EVERYTHING IS BORKENNNNNN
			attribute[0] = _(attribute[0]).trim();
			attribute[1] = _(attribute[1]).trim();
			if (!attribute[0] && !attribute[1]) {
				attributes.splice(i, 1);
			} else {
				effects.push({key: attribute[0], value: attribute[1]});
			}
		}, this);
		return effects;
	},

	//inverse operation to treatEffects, returning an effects string
	untreatEffects: function(effects) {
		var attributes = _.map(effects, function(effect) {
			return _(effect.key).capitalized() + ": " + effect.value;
		});
		return attributes.join("; ");
	},

	removeEffect: function(effects, name) {
		var filtered = _.filter(effects, function(e) {
		    // Only keep effects that do not contain the given effect
		    return !leiminauts.utils.effectNameContains(e, name);
		});
		return filtered;
	},

	//removes any multiplier effect from an effects string
	removeMultiplierEffects: function(effectsString) {
		var effects = leiminauts.utils.treatEffects(effectsString);
		var filtered = leiminauts.utils.removeEffect(effects, "multiplier");
		return leiminauts.utils.untreatEffects(filtered);
	},

	effectNameContains: function(effect, value) {
		return effect.key.toLowerCase().indexOf(value.toLowerCase()) > -1;
	},

	number: function(number, decimals) {
		number = number*1;
		if (_(number).isNaN()) return number;
		decimals = decimals || 2;
		return number % 1 !== 0 ? number.toFixed(decimals) : number;
	},

	dps: function(damage, speed) {
		return leiminauts.utils.number( (parseFloat(speed)/60*parseFloat(damage)).toFixed(2) );
	}
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		this.skills = this.get('skills');
		this.set('total_cost', 0);
		this.set('maxed_out', false);
		this.set('level', 1);
		this.listenTo(this.skills, 'change:total_cost', this.onCostChange);
		this.listenTo(this.skills, 'change:maxed_out', this.onSkillComplete);

		this.on('change:selected', this.onSelectedChange, this);
	},

	onCostChange: function() {
		var cost = 0;
		this.skills.each(function(skill) {
			cost += skill.get('total_cost');
		});
		this.set('level', Math.floor( (cost-100)/100) <= 1 ? 1 : Math.floor((cost-100)/100));
		this.set('total_cost', cost);
	},

	onSkillComplete: function() {
		var maxed = true;
		_(this.skills.pluck('maxed_out')).each(function(max) {
			if (!max) {
				maxed = false;
				return false;
			}
		});
		this.set('maxed_out', maxed);
	},

	onSelectedChange: function() {
		this.skills.each(function(skill) {
			skill.set('selected', this.get('selected'));
		}, this);
	},

	reset: function() {
		this.skills.each(function(skill) {
			skill.setActive(false);
			if (!skill.get('toggable'))
				skill.resetUpgradesState(false);
		}, this);
	}
});

/**
 * this is our full "database"
 * we have a characters list > each character has skills > each skills has upgrades
 */
leiminauts.CharactersData = Backbone.Collection.extend({
	model: leiminauts.Character,

	initialize: function(models, opts) {
		//each character has skills
		//each skills has upgrades
		if (opts.data !== undefined) {
			this.data = opts.data;
			this.console = opts.console || false;

			var characters, skills, upgrades;
			if (this.data) {
				leiminauts.characters = this.data.characters;
				leiminauts.skills = this.data.skills;
				leiminauts.upgrades = this.data.upgrades;

				_.each(leiminauts.characters, function(character) {
					var charSkills = _(leiminauts.skills).where({ character: character.name });
					character.skills = new leiminauts.Skills(charSkills);
					this.add(character);
				}, this);
			}
		}
	}
});
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
			this.initBaseEffects();
			this.initUpgrades();
			this.set('total_cost', 0);
			this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
			this.set('toggable', !this.get('active'));
		}
	},

	initBaseEffects: function() {
		if (!this.get('selected'))
			return false;
		if (!_(this.get('effects')).isString())
			return false;

		var baseEffects = leiminauts.utils.treatEffects(this.get('effects'));

		if (this.get('type') == "jump") {
			var solar = _(baseEffects).findWhere({key: "solar"});
			if (!solar)
				baseEffects.push({key: "solar", value: 235});

			var solarPerMin = _(baseEffects).findWhere({key: "solar per min"});
			if (!solarPerMin)
				baseEffects.push({key: "solar per min", value: 30});
		}

		this.set('baseEffects', baseEffects);
	},

	initUpgrades: function() {
		// Use the common upgrades named Jump for the jump skill
		var skillName = (this.get('type') == "jump" ? "Jump" : this.get('name'));
		var skillUpgrades = _(leiminauts.upgrades).where({ skill: skillName });

		// Handle pills and unique character upgrades for the jump skill
		if (skillName === "Jump") {
			var upgradesObj = _(skillUpgrades);

			// Handle character specific pills
			var baseEffects = this.get('baseEffects');
			var pills = _(baseEffects).findWhere({key: "pills"});
			if (pills) {
				// Remove pills value from baseEffects
				var index = _(baseEffects).indexOf(pills);
				baseEffects.splice(index, 1);

				// Remove unused pills from upgrades
				var unwantedPills = {"turbo": "Power Pills Turbo", "light": "Power Pills Light", "companion": "Power Pills Companion"};
				delete unwantedPills[pills.value];

				_(unwantedPills).each(function(pillsName) {
					var pill = upgradesObj.findWhere({ name: pillsName });
					var index = upgradesObj.indexOf(pill);
					if (index >= 0)
						skillUpgrades.splice(index, 1);
				});
			}

			// Replace unique jump upgrades with common ones
			var characterJumpUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(characterJumpUpgrades).each(function(newUpgrade) {
				var oldUpgrade = upgradesObj.findWhere({ skill: "Jump", name: newUpgrade.replaces });
				var index = upgradesObj.indexOf(oldUpgrade);
				skillUpgrades[index] = _(newUpgrade).clone();
			});
		} else {
			// Link the upgrade to the skill to enable upgrade shortcut
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
		return this.upgrades.filter(function(upgrade) {
			return upgrade.get('active') === true;
		});
	},

	getActiveSteps: function() {
		return this.getActiveUpgrades().map(function(upgrade) {
			return upgrade.get('current_step');
		});
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
		var effects = this.mergeEffectsAndSteps(this.get('baseEffects'), activeSteps);
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

	mergeEffectsAndSteps: function(baseEffects, activeSteps) {
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
				// Otherwise, don't sort so that the baseEffect is still the first value
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
			var baseStages = baseUpgrade.split(' > ');

			var effectStages = [];
			var effectNumbers = [];
			for (var i = 0; i < baseStages.length; ++i) {
				effectStages[i] = "";
				effectNumbers[i] = 0;
			}

			// Merge all upgrades into effectStages
			_(upgrades).each(function(upgrade) {
				var upgradeStages = String(upgrade).split(' > ');
				var regexResults = [];
				_(upgradeStages).each(function(u) {
					regexResults.push(upgradeRegex.exec(u));
				});

				if (effectStages.length == 1 && upgradeStages.length > 1) {
					// Split up effectStages so we can apply upgradeStages to every one of them
					for (var i = 1; i < upgradeStages.length; ++i) {
						effectStages.push(effectStages[0]);
						effectNumbers.push(effectNumbers[0]);
					}
				}

				_(effectStages).each(function(effect, i, stages) {
					// Apply the upgrade stages pair-wise if there are multiple upgrade stages
					var upgradeIndex = (upgradeStages.length == 1 ? 0 : i);

					var upgrade = upgradeStages[upgradeIndex];
					var regexResult = regexResults[upgradeIndex];
					var effectNumber = effectNumbers[i];
					var result = this.applyUpgrade(upgrade, regexResult, effectNumber, baseUpgrade);
					stages[i] = result[0];
					effectNumbers[i] = result[1];
				}, this);
			}, this);

			this.get('effects').push({"key": key, value: effectStages.join(' > ')});
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
			if (regexResult[1] && regexResult[1] == "/") {
				operation = "/";
			}
			else if (regexResult[1] && regexResult[1] == "@") {
				operation = "@";
			}
			else if (regexResult[1] && regexResult[1] == "-") {
				upgradeNumber = -upgradeNumber;
			}

			if (regexResult[3] && regexResult[3] == "%" && !baseIsPercent) {
				operation = "%";
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
			bonusesDmg.push('yakoiza damage', 'codfather damage');
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
				missilesSequence[number] = (baseDamage + (40*number))*parseInt(missile.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: missile.key }) ), 1 );
			});
			while ((missilesSequence.length > 1) && (missilesSequence[missilesSequence.length-1] == baseDamage))
				missilesSequence.pop();
			avgDmg = _(missilesSequence).reduce(function(memo, num){ return memo + num; }, 0) / missilesSequence.length;
			effects.findWhere({key: "damage"}).value = missilesSequence.join(' > ');
			if (missilesSequence.length !== 1 && avgDmg !== missilesSequence[0])
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
				cloverDmg = this.bonusDamage(dmg, "2nd hit damage", effects);
				avgDmg = (dmg.value*1+cloverDmg)/2;
				dmg.value = [dmg.value*1, cloverDmg].join(' > ');
				effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});

				if (backstab && bsEffect) {
					cloverDmgBs = this.bonusDamage(backstabDmg, "2nd hit damage", effects);
					bsEffect.value = [backstabDmg*1, cloverDmgBs].join(' > ');
					backstabDmg = (backstabDmg*1+cloverDmgBs)/2;
					effects.push({key: "avg backstab damage", value: leiminauts.utils.number(backstabDmg)});
				}

				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "2nd hit damage" }) ), 1 );
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
			dmg = +effects.findWhere({key: "damage"}).value;
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
	},

	setDPS: function() {
		if (!this.get('selected')) return false;
		if (this.get('name') == "Laser") return false; //dps is set in specifics for the laser

		var effects = _(this.get('effects'));

		//normal DPS
		var attackSpeedEffect = effects.findWhere({key: "attack speed"});

		var damage;
		var damageEffect = effects.findWhere({key: "avg damage"});
		if (damageEffect) {
			damage = damageEffect.value;
		}
		else {
			// Calculate the average damage of 'damage'
			damageEffect = effects.findWhere({key: "damage"});
			if (damageEffect) {
				var damageStages = damageEffect.value.split(' > ');
				damage = damageStages.reduce(function(a, b) { return parseFloat(a) + parseFloat(b); }) / damageStages.length;
				if (damageStages.length > 1) {
					effects.push({key: "avg damage", value: leiminauts.utils.number(damage)});
				}
			}
		}
		var dps = effects.findWhere({key: "DPS"});
		if (attackSpeedEffect && damage) {
			dpsVal = leiminauts.utils.dps(damage, attackSpeedEffect.value);
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
			var deniedBonusWords = ["storm", "bonus", "avg", "yakoiza", "grenade", "snipe", "max", "structure", "ability"];
			effects.each(function(e) {
				var denied = false;
				_(deniedBonusWords).each(function(word) { if (e.key.toLowerCase().indexOf(word) === 0) { denied = true; }});
				if (denied) return false;
				var specificDmg = (e.key).match(/(.+) damage/i);
				var specificAS = (e.key).match(/(.+) attack speed/i);
				if (specificDmg) bonusCheck.damage.push(specificDmg[1]);
				if (specificAS) bonusCheck.attackSpeed.push(specificAS[1]);
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

		effects.each(function(effect) {
			var result = (effect.key).match(/(.+) multiplier/i);
			if (result && effect.value) {
				effects.splice(effects.indexOf(effect), 1);
				this.multiplyEffect(effect.value, effects, result[1]);

				if (this.get('name') == "Bubble Gun") {
					this.multiplyEffect(effect.value, effects, "codfather damage");
					this.multiplyEffect(effect.value, effects, "yakoiza damage");
				}
			}
		}, this);
	},

	multiplyEffect: function(times, effects, effectKey) {
		effectKey = effectKey || "damage";
		var effect = effects.findWhere({key: effectKey});
		if (effect) effect.value = leiminauts.utils.number(effect.value*times) + "&nbsp; ( " + effect.value + "×" + times + " )";

		var dmgLength = "damage".length;
		if (effectKey.substr(-dmgLength) === "damage") {
			var dpsPrefix = effectKey.substr(0, effectKey.length - dmgLength);
			var dps = effects.findWhere({key: dpsPrefix + "DPS"});
			if (dps) dps.value = leiminauts.utils.number(dps.value*times) + "&nbsp; ( " + dps.value + "×" + times + " )";
		}
	},

	bonusDamage: function(baseDmg, effect, effects) {
		var dmg = parseFloat(baseDmg && baseDmg.value ? baseDmg.value : baseDmg);
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Upgrade = Backbone.Model.extend({
	defaults: {
		current_step: null,
		max_step: 0,
		active: false,
		locked: false
	},

	initialize: function(attrs, opts) {
		var steps = _(this.attributes).filter(function(attr, key) {
			return (/^step[0-9]$/).test(key) && _.trim(attr) !== "";
		});
		var stepsCollection = new leiminauts.Steps([ new leiminauts.Step({ upgrade: this.toJSON() }) ]);
		_(steps).each(function(step, i)  {
			stepsCollection.add({ level: i+1, description: step, upgrade: this.toJSON() });
		}, this);
		this.set('steps', stepsCollection);
		this.set('max_step', stepsCollection.size()-1);

		this.set('description', _(this.get('description').replace(/\n/g, "<br>")).italics());

		this.setStep(0);
	},

	setStep: function(number) {
		number = parseInt(number, 10);
		if (number > this.get('max_step')) number = this.get('max_step');
		if (number < 0) number = 0;
		var currentStep = this.get('steps').findWhere({level: number});
		this.set('current_step', currentStep);
		this.set('active', currentStep.get('level') > 0);
	}
});

leiminauts.Upgrades = Backbone.Collection.extend({
	model: leiminauts.Upgrade
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Step = Backbone.Model.extend({
	defaults: {
		level: 0,
		description: ''
	},

	initialize: function() {
		//description is a string showing the list of effects the step gives. Ex: "crit chance: +15%; crit damage: +10"
		//so each attribute is separated by a ";"
		//and attribute name and value are separated by a ":"
		this.set('attrs', leiminauts.utils.treatEffects(this.get('description')));

		this.updateDescription();
	},

	updateDescription: function() {
		this.set('description', this.get('description').replace(/: @/g, ': '));
	}
});

leiminauts.Steps = Backbone.Collection.extend({
	model: leiminauts.Step
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharactersView = Backbone.View.extend({
	className: 'chars-list-container',

	events: {
		"click .char[data-id]": "selectCharacter"
	},

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.listenTo(this.collection, 'add remove reset', this.render);

		if (this.options.character !== undefined)
			this.character = this.options.character.model.toJSON();
		this.console = this.options.console !== undefined ? this.options.console : false;

		this.currentChar = null;

		this.mouseOverTimeout = null;

		this.mini = this.options.mini || false;

		this.$el.on('mouseover', '.char', _.bind(_.debounce(this.showCharInfo, 50), this));
		this.$el.on('click', '.current-char', _.bind(this.reset, this));
	},

	render: function(opts) {
		opts = _.extend({}, { currentCharOnly: false }, (opts || {}) );
		var newHtml = this.template({
			characters: this.collection.toJSON(),
			currentChar: this.currentChar,
			character: this.character,
			console: this.options.console,
			mini: this.mini
		});
		if (opts.currentCharOnly) {
			this.$('.current-char').html( $( $.parseHTML('<div>' + newHtml + '</div>') ).find('.current-char').html() );
		}
		else
			this.$el.html(newHtml);
		return this;
	},

	selectCharacter: function(e) {
		this.collection.trigger('selected', $(e.currentTarget).attr('data-id'));
	},

	showCharInfo: function(e) {
		if (this.character) return false;
		var character = $(e.currentTarget).attr('data-char');
		if (character && (!this.currentChar || this.currentChar.get('name') !== character)) {
			this.currentChar = this.collection.findWhere({name: character});
			this.render({ currentCharOnly: true });
		}
	},

	reset: function(e) {
		this.currentChar = null;
		this.render();
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
		"click .char-forum-switch button": "toggleForumViews"
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null, info: null, console: false, forum: false });

		this.template = _.template( $('#char-tpl').html() );

		this.console = opts.console;
		this.forum = opts.forum;

		this.characters = new leiminauts.CharactersView({ character: this, collection: this.collection, console: this.console, mini: true });
		this.build = new leiminauts.BuildView({ character: this, forum: this.forum });
		this.info = new leiminauts.InfoView({ character: this, forum: this.forum });
		this.order = new leiminauts.OrderView({ character: this, forum: this.forum });
		this.subViews = [this.characters, this.build, this.info, this.order];

		this.order.on('changed', function(collection) {
			this.trigger('order:changed', collection);
			this.toggleForumTabs();
		}, this);

		this.order.on('toggled', function() {
			this.trigger('order:toggled');
			this.toggleForumTabs();
		}, this);

		if (this.forum)
			this.order.collection.on('all', this.toggleForumTabs, this);

		this.render();

		this.toggleTimeout = null;

		this.listenTo(this.model, 'change:maxed_out', this.toggleMaxedOutView);
	},

	remove: function() {
		_(this.subViews).each(function(subView) {
			subView.remove();
		});
		Backbone.View.prototype.remove.call(this);
	},

	render: function() {
		var data = this.model.toJSON();
		data.console = this.console;
		data.forum = this.forum;
		this.$el.html(this.template( data ));
		this.assign(this.characters, '.chars');
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		if (this.forum)
			this.toggleForumViews(null, 'build');
		return this;
	},

	toggleMaxedOutView: function() {
		//transitionend doesn't seem to fire reliably oO going with nasty timeouts that kinda match transition duration
		if (!this.forum) {
			var timeOutTime = Modernizr.csstransitions ? 500 : 0;
			if (this.model.get('maxed_out')) {
				this.toggleTimeout = setTimeout(_.bind(function() {
					this.$('.upgrade:not(.active)').addClass('hidden');
				}, this), timeOutTime);
			} else{
				clearTimeout(this.toggleTimeout);
				this.$('.upgrade:not(.active)').removeClass('hidden');
			}
		}
		setTimeout(_.bind(function() {
			this.$el.toggleClass('maxed-out', this.model.get('maxed_out'));
			this.$('.forum-snippet').attr('rows', this.model.get('maxed_out') ? 6 : 1);
		}, this), 0);
	},

	toggleForumViews: function(e, forcedClass) {
		forcedClass = forcedClass || null;
		itemClass = forcedClass ? forcedClass : $(e.currentTarget).attr('data-item');
		this.$('.char-forum-switch button').removeClass('switch-active');
		if (e)
			$(e.currentTarget).addClass('switch-active');
		if (forcedClass)
			this.$('.char-forum-switch button[data-item="' + forcedClass + '"]').addClass('switch-active');
		this.$('.build').toggleClass('forum-hidden', itemClass != 'build');
		this.$('.order').toggleClass('forum-hidden', itemClass != 'order');
	},

	toggleForumTabs: function() {
		this.$('.char-forum-switch').toggleClass('forum-hidden', !this.order.active);
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.BuildView = Backbone.View.extend({
	tagName: 'div',

	className: 'build',

	events: {
		"click .build-cancel": "reset"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.forum = this.options.forum || false;

		this.skills = [];
		this.model.get('skills').each(function(skill) {
			this.skills.push(new leiminauts.SkillView({ model: skill, forum: this.forum }));
		}, this);

		this.template = _.template( $('#build-tpl').html() );

		//not that good to put this here but YOLO
		this.listenTo(this.model.get('skills'), 'change:active', this.toggleResetButtonClass);
		this.model.get('skills').each(function(skill) {
			this.listenTo(skill.get('upgrades'), 'change:active', this.toggleResetButtonClass);
		}, this);
		this.toggleResetButtonClass();
	},

	//not that good to put this here but YOLO
	toggleResetButtonClass: function() {
		if (!this.$resetButton) return false;

		var active = false;
		this.model.get('skills').each(function(skill) {
			if ( (skill.get('active') && skill.get('toggable')) || skill.getActiveUpgrades().length > 0) {
				active = true;
				return false;
			}
		});
		this.$resetButton.toggleClass('active', active);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.$resetButton = this.$('.build-cancel');
		_(this.skills).each(function(skill) {
			skill.delegateEvents();
			this.$el.append(skill.render().el);
		}, this);
		return this;
	},

	reset: function() {
		this.model.get('skills').each(function(skill) {
			skill.setActive(false);
			if (!skill.get('toggable'))
				skill.resetUpgradesState(false);
		});
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#order-tpl').html() );

		this.active = true;

		this.forum = this.options.forum;

		this.on('toggled', this.toggleView, this);

		this.collection = new Backbone.Collection(null, { comparator: this.comparator });

		this.collection.on('reset', this.onBuildChange, this);

		this.model.get('skills').each(function(skill) {
			this.listenTo(skill.get('upgrades'), 'change:current_step', this.onBuildChange);
		}, this);
		this.listenTo(this.model.get('skills'), 'change:active', this.onBuildChange);
		this.listenTo(this.model, 'change:selected', this.onSelectedChange);

		this.on('sorted', this.render, this);
	},

	toggle: function() {
		this.active = !this.active;
		this.trigger('toggled');
	},

	toggleView: function() {
		if (!this.$el) return false;
		this.$el.find('ul').toggleClass('hidden', !this.active);
		this.$el.find('input[name="active"]').prop('checked', this.active);
	},

	onBuildChange: function(model) {
		this.updateCollection(model);
		this.render();
	},

	onSelectedChange: function() {
		if (!this.model.get('selected'))
			this.collection.reset();
	},

	comparator: function(model) {
		return model.get('order') || 0;
	},

	render: function() {
		var data = this.collection.toJSON();
		var totalCost = 0;
		_(data).each(function(item) {
			totalCost += item.upgrade ? item.upgrade.cost*1 : item.cost*1;
			item.order_total_cost = totalCost;
			item.order_req_lvl = Math.floor((totalCost-100)/100) <= 1 ? 1 : Math.floor((totalCost-100)/100);
		});
		this.$el.html(this.template({ items: data, active: this.active, forum: this.forum }));

		this.$('.order-item').on('mouseover mouseout click dragstart', this.handleTooltip);
		if (!this.forum) {
			this.$('input[name="active"]').on('change', _.bind(this.toggle, this));
			this.$list = this.$el.children('ul').first();
			this.$list.sortable({items: '.order-item'});
			this.$list.on('sortupdate', _.bind(this.updateOrder, this));
		}
		this.toggleView();
		return this;
	},

	updateCollection: function(model) {
		if (model instanceof leiminauts.Skill) {
			if (model.get('active'))
				this.collection.add(model, { sort: false });
			else
				this.collection.remove(model);
		} else if (model instanceof leiminauts.Upgrade) {
			var lvl = model.get('current_step').get('level');
			var steps = this.collection.filter(function(item) {
				return item instanceof leiminauts.Step && item.get('upgrade').name == model.get('name');
			});
			if (lvl !== 0) {
				if (lvl > 1 && !steps.length) {
					var toAdd = [];
					model.get('steps').each(function(step) {
						if (step.get('level') < lvl)
							toAdd.push(step);
					});
					this.collection.add(toAdd, { sort: false });
				} else
					this.collection.add(model.get('current_step'), { sort: false });
			} else {
				this.collection.remove(steps);
			}
		}
		if (this.active) {
			this.trigger('changed', this.collection);
		}
	},

	updateOrder: function() {
		if (!this.$list) return false;
		this.$list.children().each(_.bind(function(i, item) {
			this.collection.get($(item).attr("data-cid")).set('order', i, { silent: true });
		}, this));
		this.collection.sort();
		if (this.active) {
			this.trigger('changed', this.collection);
			this.trigger('sorted', this.collection);
		}
		return false;
	},

	handleTooltip: function(e) {
		if (e.type == "mouseover")
			MouseTooltip.show($(e.currentTarget).find('.order-popup').html());
		else
			MouseTooltip.hide();
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.InfoView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-info',

	events: {
		"click .forum-snippet": "focusForumSnippet"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.template = _.template( $('#info-tpl').html() );

		this.forum = this.options.forum || false;

		this.listenTo(this.character.model, 'change:total_cost', this.render);
	},

	render: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		this.$el.html(this.template(data));

		leiminauts.ev.trigger('update-specific-links');
		return this;
	},

	focusForumSnippet: function() {
		this.$('.forum-snippet').select();
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.SkillView = Backbone.View.extend({
	tagName: 'div',

	className: 'skill-wrapper',

	events: {
		'mouseover .skill-icon': 'handleTooltip',
		'mouseout .skill-icon': 'handleTooltip',
		'click .skill-icon': 'toggleState',
		'click .skill-cancel': 'reset'
	},

	initialize: function() {
		this.forum = this.options.forum || false;

		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade, forum: this.forum }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );

		this.listenTo(this.model.get('upgrades'), 'change', this.renderUpgradesInfo);

		this.listenTo(this.model, 'change', this.render);
	},

	toggleState: function() {
		if (this.forum) return false;
		this.model.setActive(!this.model.get('active'));
	},

	reset: function() {
		this.model.setActive(false);
		if (!this.model.get('toggable'))
			this.model.resetUpgradesState(false);
	},

	//that's *really* not good to handle this like that but gah - i'm tired
	//(I don't want the upgrades to rebuild each time we render, it's useless and doesn't permit to use cool animations on compact/full view toggle
	render: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		if (!this.$el.html()) {
			this.$el.html(this.template( data ));
			_(this.upgrades).each(function(upgrade) {
				upgrade.delegateEvents();
				this.$('.skill-upgrades').append(upgrade.render().el);
			}, this);
		} else {
			this.$('.skill').toggleClass('active', data.active);
			this.$('.skill').toggleClass('skill-maxed-out', data.maxed_out);
			this.$('.skill-effects').toggleClass('hidden', !data.effects.length);
			this.$('.skill-cancel').toggleClass('active', (data.toggable && data.active) || (data.upgrades.where({ active: true }).length > 0));
			_(this.upgrades).invoke('delegateEvents');
		}
		this.renderUpgradesInfo();
		return this;
	},

	renderUpgradesInfo: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		this.$(".skill-effects").html(
			_.template(
				$('#build-skill-effects-tpl').html(),
				data
			)
		);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.skill-popup').html());
		else
			MouseTooltip.hide();
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.UpgradeView = Backbone.View.extend({
	tagName: 'div',

	className: 'upgrade',

	events: {
		'mouseover': 'handleTooltip',
		'mouseout': 'handleTooltip',
		'click': 'onClick'
	},

	initialize: function() {
		this.template = _.template( $('#build-upgrade-tpl').html() );

		this.forum = this.options.forum || false;

		this.listenTo(this.model, 'change', this.render);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		_(['active', 'locked']).each(function(prop) {
			this.$el.toggleClass(prop, this.model.get(prop));
		}, this);
		return this;
	},

	onClick: function(e) {
		if (this.forum) return false;
		this.updateStep();
		//update the tooltip immediatly so the user don't have to move its mouse to see the current step's description
		this.handleTooltip(e);
	},

	handleTooltip: function(e) {
		if (e.type == "mouseover")
			MouseTooltip.show(this.$('.upgrade-popup').html());
		else if (e.type == "click")
			MouseTooltip.html(this.$('.upgrade-popup').html());
		else
			MouseTooltip.hide();
	},

	updateStep: function() {
		if (this.model.get('locked')) {
			var skill = this.model.get('skill');
			if (skill && (!_.isObject(skill) || skill.get('active')))
				return false;
			if (skill) skill.setActive(true);
		}
		var currentStep = this.model.get('current_step') ? this.model.get('current_step').get('level') : 0;
		if (currentStep >= this.model.get('max_step'))
			this.model.setStep(0);
		else
			this.model.setStep(currentStep +1);
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.App = Backbone.Router.extend({
	routes: {
		"(console)": "charactersList",
		":naut(/:build)(/:order)(/console)(/forum)(/)": "buildMaker"
	},

	initialize: function(options) {
		leiminauts.ev = _({}).extend(Backbone.Events);

		leiminauts.root = window.location.host;

		if (options.data !== undefined) {
			this.data = new leiminauts.CharactersData(null, { data: options.data, console: options.console });
			this.data.on('selected', function(naut) {
				this.navigate(naut, { trigger: true });
			}, this);
		}
		this.$el = $(options.el);

		this.console = options.console;
		$('html').toggleClass('console', this.console);

		this._beforeRoute();

		this.grid = [];

		this.forum = options.forum;

		this.handleEvents();
	},

	handleEvents: function() {
		leiminauts.ev.on('update-specific-links', this.updateSpecificLinks, this);
	},

	_beforeRoute: function() {
		var url = this.getCurrentUrl();
		var oldConsole = this.console !== undefined ? this.console : undefined;
		var oldCompact = this.forum !== undefined ? this.forum : undefined;
		this.console = url.indexOf('console') !== -1;
		this.forum = url.indexOf('/forum') !== -1;
		if (oldConsole !== this.console) {
			window.location.reload();
		}
		if (oldCompact !== this.forum)
			$('html').toggleClass('forum', this.forum);
	},

	updateSpecificLinks: function() {
		var url = this.getCurrentUrl();
		$('.console-button a').attr('href', "/#" + (url.indexOf('console') !== -1 ? url.replace('console', '') : url + '/console'));

		var snippet = "[build]" + window.location.hash.substr(1) + "[/build]";
		$('.forum-snippet').val(snippet);

		$('.website-url').attr('href', window.location.href.replace('/forum', ''));
	},

	charactersList: function() {
		this._beforeRoute();
		$('html').removeClass('page-blue').addClass('page-red');

		var charsView = new leiminauts.CharactersView({
			collection: this.data,
			console: this.console
		});
		this.showView( charsView );
		this.updateSpecificLinks();
	},

	buildMaker: function(naut, build, order) {
		if (!_.isNaN(parseInt(naut, 10)))
			return false;
		this._beforeRoute();
		if (naut == "Skolldir") naut = "Skølldir"; //to deal with encoding issues in Firefox, ø is replaced by "o" in the URL. Putting back correct name.
		naut = _.ununderscored(naut).toLowerCase();

		//check if we're just updating current build (with back button)
		if (this.currentView && this.currentView instanceof leiminauts.CharacterView &&
			this.currentView.model && this.currentView.model.get('name').toLowerCase() == naut) {
			this.updateBuildFromUrl();
			this.updateSpecificLinks();
			return true;
		}

		$('html').addClass('page-blue').removeClass('page-red');

		var character = this.data.filter(function(character) {
			var selected = character.get('name').toLowerCase() == naut;
			character.set('selected', selected);
			return selected;
		});
		if (character.length) character = character[0]; else return false;

		character.reset();
		var charView = new leiminauts.CharacterView({
			collection: this.data,
			model: character,
			console: this.console,
			forum: this.forum
		});
		this.showView( charView );

		this._initGrid();

		this.updateBuildFromUrl();
		var debouncedUrlUpdate = _.debounce(_.bind(this.updateBuildUrl, this), 500);
		this.stopListening(character.get('skills'), 'change');
		this.listenTo(character.get('skills'), 'change', debouncedUrlUpdate);
		charView.on('order:changed', debouncedUrlUpdate, this);
		charView.on('order:toggled', debouncedUrlUpdate, this);
		this.updateSpecificLinks();
	},

	showView: function(view) {
		if (this.currentView)
			this.currentView.remove();
		this.$el.html(view.render().el);
		this.currentView = view;
		return view;
	},

	updateBuildFromUrl: function() {
		if (!(this.currentView instanceof leiminauts.CharacterView))
			return false;
		charView = this.currentView;
		var character = charView.model;
		var currentUrl = this.getCurrentUrl();
		var urlParts = currentUrl.split('/');
		var build = urlParts.length > 1 ? urlParts[1] : null;
		var order = urlParts.length > 2 && !_(['forum', 'console']).contains(urlParts[2]) ? urlParts[2] : null;
		if (build === null) {
			character.reset();
			return false;
		}
		var currentSkill = null;
		//we look at the build as a grid: 4 skills + 6 upgrades by skills = 28 items
		//each line of the grid contains 7 items, the first one being the skill and the others the upgrades
		for (var i = 0; i < 28; i++) {
			if (i % 7 === 0) { //it's a skill!
				currentSkill = character.get('skills').at(i/7);
				currentSkill.setActive(build.charAt(i) === "1");
			} else if (currentSkill) { //it's an upgrade!
				var upgrd = currentSkill.get('upgrades').at( (i % 7) - 1 );
				if (upgrd)
					upgrd.setStep(build.charAt(i));
			}
		}

		if (order) {
			var grid = this._initGrid();
			var orderPositions = order.split('-');
			var count = _(orderPositions).countBy(function(o) { return o; });
			var doneSteps = {};
			var items = [];
			_(orderPositions).each(function(gridPos, i) {
				var item = grid[gridPos-1];
				if (item instanceof leiminauts.Skill)
					items.push(item);
				if (item instanceof leiminauts.Upgrade) {
					if ((count[gridPos] > 1 || doneSteps[gridPos]) ) {
						doneSteps[gridPos] = doneSteps[gridPos] ? doneSteps[gridPos]+1 : 1;
						count[gridPos] = count[gridPos] - 1;
						items.push(item.get('steps').at(doneSteps[gridPos]));
					} else if (!doneSteps[gridPos])
						items.push(item.get('steps').at(1));
				}
			});
			charView.order.collection.reset(items, { sort: false });
		} else
			charView.order.toggle();
	},

	updateBuildUrl: function() {
		if (!(this.currentView instanceof leiminauts.CharacterView))
			return false;
		charView = this.currentView;
		var character = charView.model;
		var order = charView.order.active ? charView.order.collection : null;
		var buildUrl = "";
		var orderUrlParts = [];
		var orderUrl = "";
		var grid = [];
		character.get('skills').each(function(skill) {
			buildUrl += skill.get('active') ? "1" : "0";
			grid.push(skill);
			skill.get('upgrades').each(function(upgrade) {
				grid.push(upgrade);
				buildUrl += upgrade.get('current_step').get('level');
			});
		});
		if (order && order.length > 0) {
			order.each(function(item) { //item can be a skill or an upgrade step
				//get the position on the grid
				if (item instanceof leiminauts.Skill) {
					orderUrlParts.push(_(grid).indexOf(item)+1);
				} else if (item instanceof leiminauts.Step) {
					//get the upgrade tied to the step
					var upgrade = _(grid).filter(function(up) {
						return up instanceof leiminauts.Upgrade && up.get('name') == item.get('upgrade').name;
					});
					upgrade = upgrade ? upgrade[0] : false;
					if (upgrade)
						orderUrlParts.push(_(grid).indexOf(upgrade)+1);
				}
			});
			orderUrl = '/' + orderUrlParts.join('-');
		}

		var currentUrl = this.getCurrentUrl();
		var newUrl = '';
		if (currentUrl.indexOf('/') === -1) { //if url is like #leon_chameleon
			newUrl = currentUrl + '/' + buildUrl + orderUrl;
		}
		else {
			newUrl = currentUrl.substring(0, currentUrl.indexOf('/') + 1) + buildUrl + orderUrl;
			//well that's ugly
			var optionalUrlParts = ['/forum', '/console'];
			_(optionalUrlParts).each(function(part) { if (currentUrl.indexOf(part) !== -1) newUrl += part; });
		}
		this.navigate(newUrl);
		this.updateSpecificLinks();
	},

	getCurrentUrl: function() {
		//the "ø"" causes some encoding differences in Chrome and Firefox which leads Backbone to reload pages when not wanted in FF
		//I tried to work with en/decodeURIComponent and all to correct encoding problems as a whole (in case other incoming dudes have special chars in their name).
		//Without any success.
		//Sadness.
		return _(window.location.hash.substring(1)).trim('/').replace('ø', 'o'); //no # and trailing slash and no special unicode characters
	},

	_initGrid: function() {
		if (this.currentView instanceof leiminauts.CharacterView && this.grid.length > 0 && this.gridChar == this.currentView.model.get('name'))
			return this.grid;
		var grid = [];
		this.currentView.model.get('skills').each(function(skill) {
			grid.push(skill);
			skill.get('upgrades').each(function(upgrade) {
				grid.push(upgrade);
			});
		});
		this.gridChar = this.currentView.model.get('name');
		this.grid = grid;
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

/**
 * loading necessary libs
 */
$(function() {
	FastClick.attach(document.body);
	MouseTooltip.init({ "3d": false });
	//small "hack" to set the page to red background directly if we're on root
	$('html').toggleClass('page-red', !window.location.hash.length);
});

/**
 * initialize Nautsbuilder
 */
;(function() {
	var forum = window.location.hash.indexOf('forum') !== -1;

	var consolenauts = window.location.hash.indexOf('console') !== -1;
	//dev determines whether nautsbuilder loads data from the dev or steam sheet.
	//remove 'false &&' in order to enable the dev version on localhost
	var dev = false && (window.location.hostname === "localhost");
	var useLocalStorage = true;
	leiminauts.sheets = [
		{ name: "steam", key: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc" },
		//dev spreadsheet: 0AuPP-DBESPOedGZHb1Ata1hKdFhSRHVzamN0WVUwMWc
		//here putting steam spreadsheet in the dev sheet to load steam server data when on dev instead of localstorage
		{ name: "dev", key: "0AuPP-DBESPOedHBBU1FCcWl2ZTZDSUdwM0JPcW0wV2c" },
		{ name: "conso", key: "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE" }
	];
	var spreadsheet = _(leiminauts.sheets).findWhere({ name: (dev ? "dev" : (consolenauts ? "conso" : "steam") ) });
	leiminauts.spreadsheet = spreadsheet;

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", data: false, console: consolenauts, forum: forum });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false});
	};
	var dataUrl = function(type) { return './data/' + spreadsheet.name + '-' + type + '.json'; };
	var loadData = function() {
		$.when(
			$.ajax({url: dataUrl('characters'), dataType: "json"}),
			$.ajax({url: dataUrl('upgrades'), dataType: "json"}),
			$.ajax({url: dataUrl('skills'), dataType: "json"})
		).done(function(chars, ups, sks) {
			var data = { characters: chars[0], skills: sks[0], upgrades: ups[0] };
			if (Modernizr.localstorage && useLocalStorage) {
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.characters', JSON.stringify(data.characters));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.skills', JSON.stringify(data.skills));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.upgrades', JSON.stringify(data.upgrades));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.date', new Date().getTime());
			}
			leiminauts.init({ data: data });
		});
	};

	//Here we define what data to load - steam, dev, console? and from where - localStorage, server?
	leiminauts.lastServerDataUpdate = leiminauts.lastServerDataUpdate || 0;
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.date') ?
		localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.date') :
		0;

	if (!useLocalStorage || leiminauts.lastServerDataUpdate === 0 || leiminauts.lastServerDataUpdate > leiminauts.localDate) {
		loadData();
	} else {
		var dataOk = true;
		if (Modernizr.localstorage) {
			var characters = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.characters');
			var skills = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.skills');
			var upgrades = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.upgrades');
			_([characters, skills, upgrades]).each(function(data) {
				if (!data || data === "undefined") {
					dataOk = false;
					return false;
				}
			});
			if (dataOk) {
				var data = {};
				data.characters = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.characters'));
				data.skills = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.skills'));
				data.upgrades = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.upgrades'));

				leiminauts.init({ data: data });
			}
		}
		if (!Modernizr.localstorage || !dataOk) {
			loadData();
		}
	}
}());

;(function() {
	//we update server data if it's obsolete or here since more than 2 days
	var update = leiminauts.lastServerDataUpdate < leiminauts.lastSpreadsheetUpdate;
	if (!update)
		update = (new Date().getTime() - leiminauts.lastServerDataUpdate) > (1000*60*60*24*2);
	if (update) {
		if ( $('.data-update-button').length ) {
			$('.data-update-button').attr('disabled', 'disabled');
		}

		var sheets = {
			steam: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			dev  : "0AuPP-DBESPOedHBBU1FCcWl2ZTZDSUdwM0JPcW0wV2c",
			conso: "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE"
		};
		var sheetsKey = _(sheets).keys();
		var updateDataFromSheet = function(sheet, dataz, tabletop) {
			var characters = JSON.stringify(tabletop.sheets('Characters').all());
			var skills = JSON.stringify(tabletop.sheets('Skills').all());
			var upgrades = JSON.stringify(tabletop.sheets('Upgrades').all());
			var data = {sheet: sheet, characters: characters, skills: skills, upgrades: upgrades};
			$.ajax({
				type: 'POST',
				url: '../../../data/update.php',
				data: data,
				complete: onSheetDataUpdated
			});
		};
		var notifyUser = function(text) {
			text = text || '';
			if ( $('.data-updated-notice').length ) {
				$('.data-updated-notice').html(text);
			}
		};
		var onSheetDataUpdated = _.after(sheetsKey.length, function() { notifyUser("The <a href=\"/\">Nautsbuilder</a>'s data is now up-to-date!"); });

		notifyUser("Updating data...");

		for (var i = sheetsKey.length - 1; i >= 0; i--) {
			var sheet = sheetsKey[i];
			(function(sheet) {
				Tabletop.init({
					key: sheets[sheet],
					debug: true,
					callback: function(dataz, tabletop) {
						updateDataFromSheet(sheet, dataz, tabletop);
					}
				});
			})(sheet);
		}
	}
})();