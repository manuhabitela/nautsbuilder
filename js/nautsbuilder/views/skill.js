leiminauts.SkillView = Backbone.View.extend({
	tagName: 'div',

	className: 'skill',

	events: {
	},

	initialize: function() {
		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));

		_(this.upgrades).each(function(upgrade) {
			upgrade.delegateEvents();
			this.$('.skill-upgrades').append(upgrade.render().el);
		}, this);
		return this;
	}
});