/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.UpgradeView = Backbone.View.extend({
	tagName: 'div',

	className: 'upgrade',

	events: {
		'mouseover': 'handleTooltip',
		'mouseout': 'handleTooltip',
		'click': 'onClick'
	},

	initialize: function() {
		this.template = _.template( $('#build-upgrade-tpl').html() );


		this.model.on('change', this.render, this);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		_(['active', 'locked']).each(function(prop) {
			this.$el.toggleClass(prop, this.model.get(prop));
		}, this);
		return this;
	},

	onClick: function(e) {
		this.updateStep();
		//update the tooltip immediatly so the user don't have to move its mouse to see the current step's description
		this.handleTooltip(e);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.upgrade-popup').html());
		else
			MouseTooltip.hide();
	},

	updateStep: function() {
		if (this.model.get('locked'))
			return false;
		var currentStep = this.model.get('current_step') ? this.model.get('current_step').get('level') : 0;
		if (currentStep >= this.model.get('max_step'))
			this.model.setStep(0);
		else
			this.model.setStep(currentStep +1);
	}
});