leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	events: {
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#order-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	}
});