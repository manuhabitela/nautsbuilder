leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.set('upgrades', new leiminauts.Upgrades());
		this.upgrades = this.get('upgrades');
		this.prepareBaseEffects();
		this.set('totalCost', 0);
		this.upgrades.on('change', this.updateEffects, this);
		this.on('change:active', this.updateEffects, this);

		this.on('change:active', this.updateUpgradesState, this);
		this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
		this.set('toggable', !this.get('active'));

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
	},

	setActive: function(active) {
		if (this.get('toggable'))
			this.set('active', !!active);
	},

	updateUpgradesState: function() {
		this.upgrades.each(function(upgrade) {
			upgrade.setStep(0);
			upgrade.set('locked', !this.get('active'));
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
		// this is KIND OF a mess. deal with it.
		this.set('effects', [], {silent: true});
		var effects = {};
		var organizeEffects = function(attributesList) {
			_(attributesList).each(function(attr) {
				if (effects[attr.key] !== undefined)
					effects[attr.key].push(attr.value);
				else
					effects[attr.key] = [attr.value];
			});
		};
		organizeEffects(this.get('baseEffects'));
		_(activeSteps).each(function(step, i) {
			organizeEffects(step.get('attrs'));
		});
		//for leon tong with max damage, our effects var now looks like: { "damage": ["+9", "+9"], "range": ["+2.4"], ...  }
		//we must combine effects values that looks like numbers so we have "damage": "+18",
		//without forgetting the possible "+", "-", "%", "s", etc
		var effectRegex = /^(\+|-)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		_(effects).each(function(values, key) {
			var effect = "";
			var oldEffect = false;
			_(values).each(function(value) {
				regexRes = effectRegex.exec(value);
				if (regexRes !== null) {
					var showUnit = true;
					var effectNumber = parseFloat(effect, 10);
					if (_(effectNumber).isNaN()) effectNumber = 0;
					if (regexRes[3] && regexRes[3] == "%" && effectNumber !== 0) {
						effectNumber = effectNumber * (1 + parseFloat(value, 10)/100);
						showUnit = false;
					}
					else
						effectNumber += parseFloat(value, 10);
					effect = effectNumber;
					if (regexRes[3] && showUnit) effect += regexRes[3];
					if (regexRes[1] && effectNumber > 0 && (!oldEffect || oldEffect.toString().indexOf('+') === 0))
						effect = "+" + effect;
				} else
					effect = value;
				oldEffect = effect;
			});
			this.get('effects').push({ "key": key, value: effect });
		}, this);
		this.setDPS();
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key.toLowerCase(); }));
	},

	prepareBaseEffects: function() {
		if (!_(this.get('effects')).isString())
			return false;
		this.set('baseEffects', leiminauts.utils.treatEffects(this.get('effects')));
		if (this.get('type') == "jump") {
			var effects = _(this.get('baseEffects'));
			effects.splice( _(effects).indexOf( _(effects).findWhere({ name: 'pills' }) ), 1 );
			var solar = effects.findWhere({key: "solar"});
			var solarPerMin = effects.findWhere({key: "solar per min"});
			if (!solar)
				effects.push({key: "solar", value: 200});
			if (!solarPerMin)
				effects.push({key: "solar per min", value: 30});
		}
	},

	setDPS: function() {
		var effects = _(this.get('effects'));
		var attackSpeed = effects.findWhere({key: "attack speed"});
		var damage = effects.findWhere({key: "damage"});
		var dps = effects.findWhere({key: "dps"});
		if (attackSpeed && damage) {
			var dpsVal = (parseFloat(attackSpeed.value, 10)/60*parseFloat(damage.value, 10)).toFixed(2);
			if (dps) dps.value = dpsVal;
			else effects.push({key: "DPS", value: dpsVal});
		}
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});