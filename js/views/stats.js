leiminauts.StatsView = Backbone.View.extend({
	tagName: 'div',

	className: 'stats',

	events: {
	},

	initialize: function() {
		this.template = _.template( $('#stats-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template());
		return this;
	}
});