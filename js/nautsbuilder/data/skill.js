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
			this.listenTo(this.character, 'change:xp_level', this.updateEffects);

			this.on('change:active', this.resetUpgradesState, this);
		} else {
			this.upgrades.off('change', this.updateEffects, this);
			this.off('change:active', this.updateEffects, this);
			this.stopListening(this.character, 'change:xp_level');

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


		var baseEffects = leiminauts.effect.effectsFromString(this.get('effects'));
		if (this.get('type') == "jump") {
			this.addBaseJumpEffects(baseEffects);
		}
		this.set('baseEffects', baseEffects);
	},

	addBaseJumpEffects: function(baseEffects) {
		var baseJump = _(leiminauts.skills).findWhere({name: "base jump", type: "jump"});
		if (!baseJump) { return; }
		var baseJumpEffects = leiminauts.effect.effectsFromString(baseJump.effects);
		_(baseEffects).defaults(baseJumpEffects);
	},

	pillsList: {'turbo': 'Power Pills Turbo', 'light': 'Power Pills Light', 'companion': 'Power Pills Companion'},
	initUpgrades: function() {
		var skillName = this.get('type') === 'jump' ? 'Jump' : this.get('name');
		var skillUpgrades = _(leiminauts.upgrades).where({ skill: skillName });

		// Handle pills and unique character upgrades for the jump skill
		if (this.get('type') === 'jump') {
			// Handle character specific pills
			var pillsEffect = this.get('baseEffects')['pills'];
			if (pillsEffect) {
				// Remove pills effect
				delete this.get('baseEffects')['pills'];

				// Get all pills that are not ours
				var unwantedPills = _(this.pillsList).filter(function(pillValue, pillKey) {
					return pillKey !== pillsEffect.value;
				});

				// Remove remaining pills from skillUpgrades
				_(unwantedPills).each(function(pillValue) {
					var pillIndex = _(skillUpgrades).findIndex(_.matcher({ name: pillValue }));
					if (pillIndex >= 0) {
						skillUpgrades.splice(pillIndex, 1);
					}
				});
			}

			// Replace unique jump upgrades with common ones
			var characterJumpUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(characterJumpUpgrades).each(function(newUpgrade) {
				var oldUpgradeIndex = _(skillUpgrades).findIndex(_.matcher({skill: "Jump", name: newUpgrade.replaces}));
				if (oldUpgradeIndex >= 0) {
					skillUpgrades[oldUpgradeIndex] = _(newUpgrade).clone();
				}
			});
		} else if (this.get('type') !== 'auto') {
			// Link skill to enable activation shortcut for upgrades
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
		this.lockNonActiveUpgrades(activeUpgrades);

		this.set('effects', [], {silent: true});
		var activeSteps = this.getActiveSteps();
		var effects = this.mergeBaseAndUpgrades(this.get('baseEffects'), activeSteps);

		// TODO: implement specific effects with new classes
		// this.setSpecificEffects();
		// this.setDPS();
		// this.setSpecificEffectsTheReturnOfTheRevenge();

		this.applyBonusEffects(effects);
		this.applySpeedEffects(effects);
		this.setMultipliers(effects);

		_(effects).each(this.applyScaling, this);

		var sortedEffects = _(effects).sortBy(function(effect) {
			return effect.key.toLowerCase();
		});
		this.set('effects', sortedEffects);
	},

	getTotalCost: function(activeUpgrades) {
		var cost = parseInt(this.get('cost'), 10);
		// Update total skill cost
		_(activeUpgrades).each(function(upgrade) {
			cost += upgrade.get('current_step').get('level') * upgrade.get('cost');
		});
		return cost;
	},

	skillIsMaxedOut: function(activeUpgrades) {
		if (activeUpgrades.length < 3) {
			return false;
		}

		return _(activeUpgrades).every(function(upgrade) {
			return upgrade.get('current_step').get('level') === upgrade.get('max_step');
		});
	},

	lockNonActiveUpgrades: function(activeUpgrades) {
		// Make all none active upgrades locked if 3 upgrades are active
		this.upgrades.each(function(upgrade) {
			upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		});
	},

	mergeBaseAndUpgrades: function(baseEffects, activeSteps) {
		var stepsEffects = _(activeSteps).map(function(step) {
			return step.get('effects');
		});
		var effectsList = [baseEffects].concat(stepsEffects);

		// Get all the effects from baseEffect and stepsEffects into one array
		var effectList = _(effectsList).chain()
			.map(_.values)
			.flatten()
			.value();

		// Group effects with same name
		var groupedEffects = _(effectList).groupBy(function(effect) {
			return effect.name;
		});

		// Merge effects into one
		return _(groupedEffects).mapObject(function(effects) {
			return leiminauts.effect.mergeEffects(effects);
		});
	},

	applyScaling: function(effect) {
		if (!effect.isScalable()) {
			return;
		}

		var scalingValue = this.getEffectScalingValue(effect.name);
		if (scalingValue === undefined) {
			return;
		}

		if (effect.number instanceof leiminauts.number.ExtendedExpression) {
			return; // Avoid duplicate scaling
		}

		var currentLevel = this.character.get('xp_level');
		effect.applyScaling(currentLevel, scalingValue);
	},

	getEffectScalingValue: function(effectName) {
		var regexMatchesEffect = function(regex) { return regex.test(effectName); };

		var matchingRow = _(leiminauts.scaling).find(function(row) {
			var filterKeys = _(Object.keys(row)).filter(function (s) { return s.indexOf("filter") === 0; });
			var filters = _.chain(filterKeys).map(function (key) {
				return row[key];
			}).filter(function (str) {
				return str && str.length > 0;
			}).value();

			// Return true if one of the filters matches the effect
			return _(filters).some(function (filter) {
				var regex = new RegExp("^" + filter + "$", "i"); // Case-insensitive
				return regex.test(effectName);
			});
		});

		if (matchingRow !== undefined) {
			return Number(matchingRow.value);
		} else {
			return undefined;
		}
	},


	filterNumericEffects: function(effects) {
		return _(effects).pick(function(effect, key) {
			return effect instanceof leiminauts.effect.NumericEffect;
		});
	},

	filterEffectList: function(effectList) {
		return _(effectList).filter(function(effect) {
			var skillsString = _(effect.skills).trim();
			if (skillsString === '*') {
				return true;
			}

			var skills = leiminauts.utils.stringToArray(skillsString);
			return _(skills).contains(this.get('name'));
		}, this);
	},

	/*

	 Type calculations
	 -----------------

	 bonus      = base ⋄ bonus

	 dps        = dmg  * speed * 1/60
	 hps        = heal * speed * 1/60

	 dot dps   = dot dmg / dot duration
	 hot hps   = hot heal / hot duration

	 total dmg  = dps * duration
	 total heal = hps * duration

	 total dps = dps + dot dps? + thorn dps? + ...
	 total hps = hps + hot hps? + ...


	 Derived effect properties
	 -------------------------

	  type           | skills   | result name | primary property | secondary property | operation
	 ----------------+----------+-------------+------------------+--------------------+----------------------------
	  bonus effect   | skills   | (not used)  | base name        | bonus prefix       | base ⋄ (prefix.base)
	  speed effect   | skills   | result name | base name        | speed name         | base * speed / 60
	  total duration | skills   | result name | base name        | duration name      | base * duration
	  over time      | skills   | result name | over time name   | duration name      | over time / duration
	  sum effects    | skill(s) | result name | effect names     | (not used)         | effect_1 + ... + effect_n

	 */

	applyBonusEffects: function(effects) {
		var bonusEffects = [
			{ base: 'damage',             prefix: 'bonus',          skills: 'Bolt .45 Fish-gun; Missiles; Bubble Gun' },
			{ base: 'damage',             prefix: 'naut',           skills: 'Slash; Protoblaster; Cut and Trim; Tongue Snatch; Tornado Move; Binding of Justice' },
			{ base: 'damage',             prefix: 'backstab',       skills: 'Slash' },
			{ base: 'damage',             prefix: 'ion blowtorch',  skills: 'Chain Whack' },
			{ base: 'damage',             prefix: 'structure',      skills: 'Shock' },
			{ base: 'damage',             prefix: 'codfather',      skills: 'Bubble Gun' },
			{ base: 'damage',             prefix: 'afro',           skills: 'Cut and Trim' },
			//{ base: 'damage',             prefix: 'afro stealth',   skills: 'Cut and Trim' },
			{ base: 'damage',             prefix: 'homing',         skills: 'Photon Mine Launcher' },
			{ base: 'damage',             prefix: 'ground',         skills: 'Splash Dash' },
			{ base: 'damage',             prefix: 'fertilized',     skills: 'Grow Weedling' },

			{ base: 'damage',             prefix: 'no naut',        skills: 'Rapid Arrows' },
			{ base: 'damage',             prefix: 'split',          skills: 'Rapid Arrows' },
			{ base: 'damage',             prefix: 'snared',         skills: 'Cat Shot / Gatling' },
			{ base: 'split damage',       prefix: 'snared',         skills: 'Cat Shot / Gatling' },
			{ base: 'fat cat damage',     prefix: 'snared',         skills: 'Cat Shot / Gatling' },
			{ base: 'fat cat split damage',prefix: 'snared',        skills: 'Cat Shot / Gatling' },

			{ base: 'damage',             prefix: 'damaged',        skills: 'Sword Strike' },

			{ base: 'anchor damage',      prefix: 'bonus',          skills: 'Anchor Swing / Ink Spray' },
			{ base: 'ink damage',         prefix: 'bonus',          skills: 'Anchor Swing / Ink Spray' },
			{ base: 'pistol damage',      prefix: 'bonus',          skills: 'Double Pistol / Bike Blaster' },

			{ base: 'damage',             prefix: 'charged',        skills: 'Techno Synaptic Wave' },
			{ base: 'heal',               prefix: 'charged',        skills: 'Techno Synaptic Wave' },
			{ base: 'heal over time',     prefix: 'charged',        skills: 'Techno Synaptic Wave' },

			{ base: 'attack speed',       prefix: 'bonus',          skills: 'Wrench Smack' },
			{ base: 'attack speed',       prefix: 'damaged',        skills: 'Rattle Smash' },
			{ base: 'bike attack speed',  prefix: 'bonus',          skills: 'Double Pistol / Bike Blaster' },
			{ base: 'pistol attack speed',prefix: 'bonus',          skills: 'Double Pistol / Bike Blaster'}
		];

		// Filter effects only matching our skill
		var matchingBonusEffects = this.filterEffectList(bonusEffects);
		var numericEffects = this.filterNumericEffects(effects);

		var grupped = _(matchingBonusEffects).groupBy('base');
		_(grupped).each(function(group, baseName) {
			var baseEffect = numericEffects[baseName];
			if (_(baseEffect).isUndefined()) {
				return;
			}

            var existingBonusEffects = _(group).chain()
				.pluck('prefix')
				.map(function(prefix) { return numericEffects[prefix + ' ' + baseName]; })
				.reject(_.isUndefined)
				.value();
			if (existingBonusEffects.length < 1) {
				return;
			}

			this.applyBonusEffectGroup(effects, baseEffect, existingBonusEffects);
		}, this);
	},

	applyBonusEffectGroup: function(effects, baseEffect, bonusEffects) {
		if (bonusEffects.length == 1) {
			// Apply bonus damage for single element
			var bonusEffect = bonusEffects[0];
			this.applyBonusEffect(effects, bonusEffect.name, baseEffect, [bonusEffect]);
			return;
		}

		// Create bonus effects for each combination of bonus effects, i.e. the power set
		console.assert(bonusEffects.length > 1);
		var baseName = baseEffect.name;
		var ignoreEmptySet = true;
		_(bonusEffects).powerSet(function(effectCombination) {
			var filteredPrefixes = _(effectCombination).map(function(e) {
				return e.name.slice(0, -(baseName.length+1));
			});
			var resultName = filteredPrefixes.join(' ') + ' ' + baseName;
			this.applyBonusEffect(effects, resultName, baseEffect, effectCombination);
		}, ignoreEmptySet, this);
	},

	applyBonusEffect: function(effects, bonusName, baseEffect, bonusEffects) {
		var resultNumber = new leiminauts.number.ExtendedExpression(baseEffect.number);
		var resultEffect = new leiminauts.effect.NumericEffect(bonusName, baseEffect.prefix, baseEffect.postfix, resultNumber);

		_(bonusEffects).each(function(bonusEffect) {
			resultEffect.applyEffect(bonusEffect);
		});

		effects[bonusName] = resultEffect;
	},

	applySpeedEffects: function(effects) {
		var speedEffects = [
			// Default DPS case
			{ base: 'damage',               speed: 'attack speed',          result: 'dps',                  skills: '*' },

			// Bonus damage with default attack speed
			{ base: 'naut damage',          speed: 'attack speed',          result: 'naut dps',             skills: 'Slash; Protoblaster; Cut and Trim; Tornado Move' },
			{ base: 'backstab damage',      speed: 'attack speed',          result: 'backstab dps',         skills: 'Slash' },
			{ base: 'naut backstab damage', speed: 'attack speed',          result: 'naut backstab dps',    skills: 'Slash' },
			{ base: 'max damage',           speed: 'attack speed',          result: 'max dps',              skills: 'Laser' },
			{ base: 'thorn damage',         speed: 'attack speed',          result: 'thorn dps',            skills: 'Bolt .45 Fish-gun' },
			{ base: 'no naut damage',       speed: 'attack speed',          result: 'no naut dps',          skills: 'Rapid Arrows' },
			{ base: 'no naut split damage', speed: 'attack speed',          result: 'no naut split dps',    skills: 'Rapid Arrows' },
			{ base: 'ion blowtorch damage', speed: 'attack speed',          result: 'ion blowtorch dps',    skills: 'Chain Whack' },
			{ base: 'split damage',         speed: 'attack speed',          result: 'split dps',            skills: 'Cat Shot / Gatling; Rapid Arrows' },
			{ base: 'snared damage',        speed: 'attack speed',          result: 'snared dps',           skills: 'Cat Shot / Gatling' },
			{ base: 'split snared damage',  speed: 'attack speed',          result: 'split snared dps',     skills: 'Cat Shot / Gatling' },
			{ base: 'structure damage',     speed: 'attack speed',          result: 'structure dps',        skills: 'Shock' },
			{ base: 'damaged damage',       speed: 'attack speed',          result: 'damaged dps',          skills: 'Sword Strike' },
			{ base: 'codfather damage',     speed: 'attack speed',          result: 'codfather dps',        skills: 'Bubble Gun' },
			{ base: 'afro damage',          speed: 'attack speed',          result: 'afro dps',             skills: 'Cut and Trim' },
			{ base: 'naut afro damage',     speed: 'attack speed',          result: 'naut afro dps',        skills: 'Cut and Trim' },
			{ base: 'homing damage',        speed: 'attack speed',          result: 'homing dps',           skills: 'Photon Mine Launcher' },
			{ base: 'fork damage',          speed: 'attack speed',          result: 'fork dps',             skills: 'Lightning Rod' },
			{ base: 'fertilized damage',    speed: 'attack speed',          result: 'fertilized dps',       skills: 'Grow Weedling' },
			{ base: 'self damage',          speed: 'attack speed',          result: 'self dps',             skills: 'Rage' },

			// Default damage with bonus attack speed
			{ base: 'damage',               speed: 'bonus attack speed',    result: 'bonus dps',            skills: 'Wrench Smack' },
			{ base: 'damage',               speed: 'damaged attack speed',  result: 'damaged dps',          skills: 'Rattle Smash' },

			// Own damage and attack speed
			{ base: 'missile damage',       speed: 'missile attack speed',  result: 'missile dps',          skills: 'Blaster' },
			{ base: 'particle damage',      speed: 'particle attack speed', result: 'particle dps',         skills: 'Shock' },
			{ base: 'fat cat damage',       speed: 'fat cat attack speed',  result: 'fat cat dps',          skills: 'Cat Shot / Gatling' },
			{ base: 'fat cat split damage', speed: 'fat cat attack speed',  result: 'fat cat split dps',    skills: 'Cat Shot / Gatling' },
			{ base: 'storm damage',         speed: 'storm attack speed',    result: 'storm dps',            skills: 'Butterfly Shot' },
			{ base: 'anchor damage',        speed: 'anchor attack speed',   result: 'anchor dps',           skills: 'Anchor Swing / Ink Spray' },
			{ base: 'ink damage',           speed: 'ink attack speed',      result: 'ink dps',              skills: 'Anchor Swing / Ink Spray' },
			{ base: 'mg damage',            speed: 'mg attack speed',       result: 'mg dps',               skills: 'Shotgun and Machine Gun' },
			{ base: 'sg damage',            speed: 'sg attack speed',       result: 'sg dps',               skills: 'Shotgun and Machine Gun' },
			{ base: 'bike damage',          speed: 'bike attack speed',     result: 'bike dps',             skills: 'Double Pistol / Bike Blaster' },
			{ base: 'bike damage',          speed: 'bonus bike attack speed',result: 'bonus bike dps',      skills: 'Double Pistol / Bike Blaster' },
			{ base: 'pistol damage',        speed: 'pistol attack speed',   result: 'pistol dps',           skills: 'Double Pistol / Bike Blaster' },
			{ base: 'pistol damage',        speed: 'bonus pistol attack speed',result: 'bonus pistol dps',  skills: 'Double Pistol / Bike Blaster' },
			{ base: 'charge damage',        speed: 'charge attack speed',   result: 'charge dps',           skills: 'Binding of Justice' },

			// Default HPS case
			{ base: 'heal',                 speed: 'attack speed',          result: 'hps',                  skills: 'Techno Synaptic Wave; Butterfly Shot' },

			{ base: 'droid heal',           speed: 'attack speed',          result: 'droid hps',            skills: 'Wrench Smack' },
			{ base: 'summon heal',          speed: 'attack speed',          result: 'summon hps',           skills: 'Wrench Smack' },
			{ base: 'droid heal',           speed: 'bonus attack speed',    result: 'bonus droid hps',      skills: 'Wrench Smack' },
			{ base: 'summon heal',          speed: 'bonus attack speed',    result: 'bonus summon hps',     skills: 'Wrench Smack' }
		];

		var matchingSpeedEffects = this.filterEffectList(speedEffects);
		var numericEffects = this.filterNumericEffects(effects);

		var foundSpeedEffects = _(matchingSpeedEffects).chain().map(function(tuple) {
			var baseEffect = numericEffects[tuple.base];
			var speedEffect = numericEffects[tuple.speed];
			return { base: baseEffect, speed: speedEffect, result: tuple.result };
		}).reject(function(tuple) {
			return _(tuple.base).isUndefined() || _(tuple.speed).isUndefined();
		}).value();

		_(foundSpeedEffects).each(function(tuple) {
			this.applySpeedEffect(effects, tuple.result, tuple.base, tuple.speed);
		}, this);
	},

	applySpeedEffect: function(effects, resultName, baseEffect, speedEffect) {
		if (_(effects).has(resultName)) {
			console.log("Warning: speed effect '" + resultName + "' already exists, ignoring new one...");
			return;
		}

		var resultNumber = new leiminauts.number.ExtendedExpression(baseEffect.number)
			.avg()
			.multiply(speedEffect.number)
			.divide(60);
		var resultEffect = new leiminauts.effect.NumericEffect(resultName, baseEffect.prefix, baseEffect.postfix, resultNumber);
		effects[resultEffect.key] = resultEffect;
	},

	applyTotalDurationEffects: function(effects) {
		var totalEffects = [
			{ result: 'total damage',        base: 'dps',        duration: 'duration',        skills: 'Tornado Move; Summon Hyper Bull; Timerift; Anchor Drop; Saw Blade; Fire Breath; Summon Robo Dinos' },
			{ result: 'charge total damage', base: 'charge dps', duration: 'charge duration', skills: 'Binding of Justice' },

			{ result: 'total heal',          base: 'hps',        duration: 'duration',        skills: 'Warp Time' }
		];

		// TODO: check if skill in skills, get base and duration effect, if existing multiply and store in result
	},

	applyOverTimeEffects: function(effects) {
		var overTimeEffects = [
			{ result: 'dot dps', base: 'damage over time', duration: 'damage duration', skills: '*' },
			{ result: 'hot hps', base: 'heal over time',   duration: 'heal duration',   skills: '*' },

			{ result: 'fork dot dps', base: 'fork damage over time', duration: 'fork damage duration', skills: 'Lightning Rod' },
			{ result: 'sticky bomb dot dps', base: 'sticky bomb damage over time', duration: 'sticky bomb damage duration', skills: 'Sticky Bomb / Nitro Boost' },
			{ result: 'smaller bomb dot dps', base: 'smaller bomb damage over time', duration: 'smaller bomb damage duration', skills: 'Sticky Bomb / Nitro Boost' },
		];

		// TODO: decide whether to use only prefixes ('heal', 'fork damage', ...) or full effect names
		// TODO: check if skill in skills, get base and duration effect, if existing divide base by duration and store in result
	},

	applySumEffects: function(effects) {
		var sumEffects = [
			{ result: 'total dps',        skills: 'Bolt .45 Fish-gun',   effects: 'dps; thorn dps' },
			{ result: 'total dps',        skills: 'Blaster',             effects: 'dps; missile dps' },
			{ result: 'total dps',        skills: 'Bite; Butterfly Shot',effects: 'dps; dot dps' },
			{ result: 'total dps',        skills: 'Shock',               effects: 'dps; particle dps' },
			{ result: 'total dps',        skills: 'Cat Shot / Gattling', effects: 'dps; fat cat dps; fat cat split dps; split dps' },
			{ result: 'total snared dps', skills: 'Cat Shot / Gattling', effects: 'snared dps; snared fat cat dps; snared fat cat split dps; snared split dps' },
			{ result: 'total dps',        skills: 'Rapid Arrows',        effects: 'dps; split dps' },
			{ result: 'total no naut dps',skills: 'Rapid Arrows',        effects: 'no naut dps; no naut split dps' },
			{ result: 'total dps',        skills: 'Lightning Rod',       effects: 'dps; dot dps; fork dps; fork dot dps'},

			{ result: 'total hps',        skills: 'Techno Synaptic Wave',effects: 'hps; hot hps'}
		];

		// TODO: check if skill in skills, get objects from effects, sum up if not empty, store in result
	},

	multiplierRegex:  /(.+) multiplier/i,
	setMultipliers: function(effects) {
		var numericEffects = this.filterNumericEffects(effects);
		var multiplierEffects = _(numericEffects).pick(function(effect, key) {
			return this.multiplierRegex.test(key);
		}, this);

		_(multiplierEffects).each(function(multiplier, multiplierKey) {
			var prefix = (multiplierKey).match(this.multiplierRegex)[1];
			var effect = numericEffects[prefix];

			// Only Expressions can have an instance count
			if (effect && effect.number instanceof leiminauts.number.Expression) {
				effect.number.instanceCount = multiplier.number.value().toNumber();
			}

			delete effects[multiplierKey];
		}, this);
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
			var attackPerSecond = effects.findWhere({key: "attack speed"}).value/60;
			var maxDamage = effects.findWhere({key: "max damage"}).value*1;
			/* Average DPS calculation breaks because of non-integer numbers of XP system.
			var minDamage = effects.findWhere({key: "damage"}).value*1;
			var steps = _(maxDamage - minDamage).times(function(i) { return i+minDamage; });

			var tickPerSecond = effects.findWhere({key: "time to next charge"}).value.replace('s', '')*1;
			var stepAttackPerSecond = attackPerSecond*tickPerSecond;
			var time = 0;
			var dmg = 0;
			_(steps).each(function(step) {
				dmg += stepAttackPerSecond*step;
				time += tickPerSecond;
			});
			var avgDPS = dmg/time;
			effects.push({key: "DPS until max", value: leiminauts.utils.number(avgDPS)});
			*/
			effects.push({key: "DPS max", value: leiminauts.utils.number(attackPerSecond*maxDamage)});
		}

		if (this.get('name') == 'Spike Dive') {
			dmg = Number(effects.findWhere({key: 'damage'}).value);

			// Make Goldfish's damage effect absolute
			var solarDamageEffect = effects.findWhere({key: 'damage with 150 solar'});
			if (solarDamageEffect) {
				solarDamageEffect.value = dmg + Number(solarDamageEffect.value);
			}

			// Handle Dead Sea Horse effects
			var spikeDamageEffect = effects.findWhere({key: 'extra spike damage'});
			var doubleSpikeDamageEffect = effects.findWhere({key: 'double extra spike damage'});
			var spikeSolarDamageEffect = effects.findWhere({key: 'extra spike damage with 150 solar'});

			// First remove all effects, avoids showing extra spike damage effects if Dead Seahorse Head is not active
			if (spikeDamageEffect) {
				effects.splice(effects.indexOf(spikeDamageEffect), 1);
			}
			if (doubleSpikeDamageEffect) {
				effects.splice(effects.indexOf(doubleSpikeDamageEffect), 1);
			}
			if (spikeSolarDamageEffect) {
				effects.splice(effects.indexOf(spikeSolarDamageEffect), 1);
			}

			var dshIsActive = this.getActiveUpgrade('dead seahorse head') !== false;
			// Set base spike damage
			if (dshIsActive && spikeDamageEffect) {
				var spikeDamage = Number(spikeDamageEffect.value);
				effects.push({key: 'extra spike damage', value: doubleSpikeDamageEffect ? 2*spikeDamage : spikeDamage });

				// Set spike damage with 150 solar
				if (spikeSolarDamageEffect) {
					var spikeSolarDamage = spikeDamage + Number(spikeSolarDamageEffect.value);
					effects.push({key: 'extra spike damage with 150 solar', value: doubleSpikeDamageEffect ? 2*spikeSolarDamage : spikeSolarDamage});
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
		var multiplierRegex = /(.+) multiplier/i;
		var partition = _(this.get('effects')).partition(function(effect) {
			return multiplierRegex.test(effect.key);
		});
		var multipliers = partition[0];
		var effects = partition[1];

		_(multipliers).each(function(multiplier) {
			var prefix = (multiplier.key).match(multiplierRegex)[1];
			this.multiplyEffect(multiplier.value, effects, prefix);

			if (this.get('name') == "Bubble Gun") {
				this.multiplyEffect(multiplier.value, effects, "codfather damage");
				this.multiplyEffect(multiplier.value, effects, "yakoiza damage");
			}
		}, this);

		this.set('effects', effects);
	},

	multiplyEffect: function(times, effects, effectKey) {
		effectKey = effectKey || "damage";
		var effect = _(effects).findWhere({key: effectKey});
		if (effect) effect.value = leiminauts.utils.number(effect.value*times) + " (" + effect.value + "×" + times + ")";

		var dmgLength = "damage".length;
		if (effectKey.substr(-dmgLength) === "damage") {
			var dpsPrefix = effectKey.substr(0, effectKey.length - dmgLength);
			var dps = _(effects).findWhere({key: dpsPrefix + "DPS"});
			if (dps) dps.value = leiminauts.utils.number(dps.value*times) + " (" + dps.value + "×" + times + ")";
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
