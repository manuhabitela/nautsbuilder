leiminauts.BuildView = Backbone.View.extend({
	tagName: 'div',

	className: 'build',

	events: {
	},

	initialize: function() {
		this.template = _.template( $('#build-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template());
		return this;
	}
});