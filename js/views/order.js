leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	events: {
	},

	initialize: function() {
		this.template = _.template( $('#order-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template());
		return this;
	}
});