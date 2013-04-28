leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.upgrades = this.get('upgrades');

		this.set('baseEffects', leiminauts.utils.treatEffects(this.get('effects')));
		this.set('effects', []);
		this.upgrades.on('change', this.updateEffects, this);
		this.on('change:active', this.updateEffects, this);

		this.on('change:active', this.updateUpgradesState, this);
		this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
		this.set('toggable', !this.get('active'));

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
			return false;
		}
		var activeUpgrades = this.getActiveUpgrades();
		var activeSteps = this.getActiveSteps();
		this.upgrades.each(function(upgrade) {
			if (this.get('active'))
				upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		}, this);

		//combine similar steps: some characters have upgrades that enhance similar things.
		// Ie Leon has 2 upgrades that add damages to its tong (1: +3/+6/+9 and 2: +9)
		//
		// this is KIND OF a mess. deal with it.
		this.set('effects', []);
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
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key; }));
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});