leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null, info: null });

		this.template = _.template( $('#char-tpl').html() );

		this.build = new leiminauts.BuildView({ character: this, state: opts.build });
		this.info = new leiminauts.InfoView({ character: this, state: opts.info });
		this.order = new leiminauts.OrderView({ character: this, state: opts.order });

		this.render();
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		return this;
	}
});