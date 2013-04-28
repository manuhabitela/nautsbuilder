leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null });

		this.template = _.template( $('#char-tpl').html() );

		//this.stats = new leiminauts.StatsView({ character: this });
		this.build = new leiminauts.BuildView({ character: this, state: opts.build });
		this.order = new leiminauts.OrderView({ character: this, state: opts.order });

		this.render();
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		//this.assign(this.stats, '.stats');
		this.assign(this.build, '.build');
		this.assign(this.order, '.order');
		return this;
	}
});