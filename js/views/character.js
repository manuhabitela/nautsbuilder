leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function() {
		this.template = _.template( $('#char-tpl').html() );

		this.stats = new leiminauts.StatsView({ character: this });
		this.build = new leiminauts.BuildView({ character: this });
		this.order = new leiminauts.OrderView({ character: this });

		this.render();
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.assign(this.stats, '.stats');
		this.assign(this.build, '.build');
		this.assign(this.order, '.order');
		return this;
	}
});