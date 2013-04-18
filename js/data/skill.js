leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.setId();
		this.on('change:name', this.setId, this);
	},

	setId: function(name) {
		name = name || this.get('name');
		if (!name) return false;
		this.set('id', _.underscored(name));
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});

leiminauts.SkillsView = Backbone.View.extend({

});

leiminauts.SkillView = Backbone.View.extend({

});