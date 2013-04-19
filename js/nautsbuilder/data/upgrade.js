leiminauts.Upgrade = Backbone.Model.extend({
	defaults: {
		current_step: 0,
		max_step: 0
	},

	initialize: function(attrs, opts) {
		this._setMaxStep();
	},

	_setMaxStep: function() {
		var steps = _(this.attributes).filter(function(attr, key) {
			return (/^step[0-9]$/).test(key) && attr !== "";
		});
		this.set('max_step', steps.length);
	}
});

leiminauts.Upgrades = Backbone.Collection.extend({
	model: leiminauts.Upgrade
});