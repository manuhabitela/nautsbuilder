leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.setId();
		this.on('change:name', this.setId, this);

		this.set('effects', []);
		this.upgrades = this.get('upgrades');
		this.upgrades.on('change', this.onUpgradesChange, this);
	},

	setId: function(name) {
		name = name || this.get('name');
		if (!name) return false;
		this.set('id', _.underscored(name));
	},

	onUpgradesChange: function(e) {
		var activeSteps = [];
		var activeUpgrades = this.upgrades.filter(function(upgrade) {
			var isActive = upgrade.get('active') === true;
			if (isActive) {
				activeSteps.push(upgrade.get('current_step'));
			}
			return isActive;
		});
		this.upgrades.each(function(upgrade) {
			upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		});

		//combine similar steps: some characters have upgrades that enhance similar things.
		// Ie Leon has 2 upgrades that add damages to its tong (1: +3/+6/+9 and 2: +9)
		this.set('effects', []);
		var effects = {};
		_(activeSteps).each(function(step, i) {
			_(step.get('attrs')).each(function(attr, y) {
				if (effects[attr.key] !== undefined)
					effects[attr.key].push(attr.value);
				else
					effects[attr.key] = [attr.value];
			});
		});
		//for leon tong with max damage, our effects var now looks like: { "damage": ["+9", "+9"], "range": ["+2.4"], ...  }
		//we must combine effects values that looks like numbers so we have "damage": "+18",
		//without forgetting the possible "+", "-", "%", "s", etc
		var effectRegex = /^(\+|-)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		_(effects).each(function(values, key) {
			var effect = "";
			_(values).each(function(value) {
				regexRes = effectRegex.exec(value);
				if (regexRes !== null) {
					var effectNumber = parseFloat(effect, 10);
					if (_(effectNumber).isNaN()) effectNumber = 0;
					effectNumber += parseFloat(value, 10);
					effect = effectNumber;
					if (regexRes[3]) effect += regexRes[3];
					if (regexRes[1]) {
						if (effectNumber > 0) effect = "+" + effect;
						if (effectNumber < 0) effect = "-" + effect;
					}
				} else
					effect = value;
			});
			this.get('effects').push({ "key": key, value: effect });
		}, this);
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});