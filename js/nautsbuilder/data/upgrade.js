leiminauts.Upgrade = Backbone.Model.extend({
	defaults: {
		current_step: null,
		max_step: 0,
		active: false,
		locked: false
	},

	initialize: function(attrs, opts) {
		var steps = _(this.attributes).filter(function(attr, key) {
			return (/^step[0-9]$/).test(key) && attr !== "";
		});
		var stepsCollection = new leiminauts.Steps([ new leiminauts.Step() ]);
		_(steps).each(function(step, i)  {
			stepsCollection.add({ level: i+1, description: step });
		});
		this.set('steps', stepsCollection);
		this.set('max_step', stepsCollection.size()-1);

		this.setStep(0);
	},

	setStep: function(number) {
		var currentStep = this.get('steps').findWhere({level: number});
		this.set('current_step', currentStep);
		this.set('active', currentStep.get('level') > 0);
	}
});

leiminauts.Upgrades = Backbone.Collection.extend({
	model: leiminauts.Upgrade
});