leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.setId();
		this.on('change:name', this.setId, this);

		this.upgrades = this.get('upgrades');
		this.upgrades.on('change:active', this.onUpgradesChange, this);
	},

	setId: function(name) {
		name = name || this.get('name');
		if (!name) return false;
		this.set('id', _.underscored(name));
	},

	onUpgradesChange: function() {
		var activeUpgrades = this.upgrades.filter(function(upgrade) {
			return upgrade.get('active') === true;
		});
		this.upgrades.each(function(upgrade) {
			upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		});
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});