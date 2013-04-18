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
		this.template = _.template( $('#build-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	}
});