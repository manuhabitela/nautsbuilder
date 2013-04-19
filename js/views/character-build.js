leiminauts.BuildView = Backbone.View.extend({
	tagName: 'div',

	className: 'build',

	events: {
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.skills = [];
		this.model.get('skills').each(function(skill) {
			this.skills.push(new leiminauts.SkillView({ model: skill }));
		}, this);

		this.template = _.template( $('#build-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		_(this.skills).each(function(skill) {
			skill.delegateEvents();
			this.$el.append(skill.render().el);
		}, this);
		return this;
	}
});