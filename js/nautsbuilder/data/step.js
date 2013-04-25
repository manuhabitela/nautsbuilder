leiminauts.Step = Backbone.Model.extend({
	defaults: {
		level: 0,
		description: ''
	},

	initialize: function(attrs, opts) {
	}
});

leiminauts.Steps = Backbone.Collection.extend({
	model: leiminauts.Step
});