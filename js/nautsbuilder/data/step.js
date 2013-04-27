leiminauts.Step = Backbone.Model.extend({
	defaults: {
		level: 0,
		description: ''
	},

	initialize: function() {
		this.set('attrs', leiminauts.utils.treatEffects(this.get('description')));
		//description is a string showing the list of effects the step gives. Ex: "crit chance: +15%; crit damage: +10"
		//so each attribute is separated by a ";"
		//and attribute name and value are separated by a ":"
	}
});

leiminauts.Steps = Backbone.Collection.extend({
	model: leiminauts.Step
});