leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function() {
		this.template = _.template( $('#char-tpl').html() );

		//this.stats = new leiminauts.StatsView();
		//this.build = new leiminauts.BuildView();
		//this.order = new leiminauts.OrderView();

		this.model.on('all', this.render, this);
		this.render();
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	}
});