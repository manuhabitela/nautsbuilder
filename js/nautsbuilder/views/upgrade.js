leiminauts.UpgradeView = Backbone.View.extend({
	tagName: 'div',

	className: 'upgrade',

	events: {
		'mouseover': 'handleTooltip',
		'mouseout': 'handleTooltip',
		'click': 'updateStep'
	},

	initialize: function() {
		this.template = _.template( $('#build-upgrade-tpl').html() );

		this.model.on('change', this.render, this);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.$el.toggleClass('active', this.model.get('active'));
		return this;
	},

	handleTooltip: function(e) {
		if (e.type == "mouseover") {
			MouseTooltip.show(this.$('.upgrade-popup').html());
		} else {
			MouseTooltip.hide();
		}
	},

	updateStep: function() {
		if (this.model.get('current_step') >= this.model.get('max_step'))
			this.model.setStep(0);
		else
			this.model.setStep(this.model.get('current_step')+1);
	}
});