leiminauts.InfoView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-info',

	events: {
		'mouseover .char-icon': 'handleTooltip',
		'mouseout .char-icon': 'handleTooltip'
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#info-tpl').html() );

		this.model.on('change:totalCost', this.render, this);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.char-popup').html());
		else
			MouseTooltip.hide();
	}
});