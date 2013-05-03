/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.SkillView = Backbone.View.extend({
	tagName: 'div',

	className: 'skill-wrapper',

	events: {
		'mouseover .skill-icon': 'handleTooltip',
		'mouseout .skill-icon': 'handleTooltip',
		'click .skill-icon': 'toggleState',
		'click .skill-cancel': 'reset'
	},

	initialize: function() {
		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );

		this.model.get('upgrades').on('change', this.renderUpgradesInfo, this);

		this.model.on('change', this.render, this);
	},

	toggleState: function() {
		this.model.setActive(!this.model.get('active'));
	},

	reset: function() {
		this.model.setActive(false);
		if (!this.model.get('toggable'))
			this.model.resetUpgradesState(false);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		_(this.upgrades).each(function(upgrade) {
			upgrade.delegateEvents();
			this.$('.skill-upgrades').append(upgrade.render().el);
		}, this);

		this.renderUpgradesInfo();
		return this;
	},

	renderUpgradesInfo: function() {
		this.$(".skill-effects").html(
			_.template(
				$('#build-skill-effects-tpl').html(),
				this.model.toJSON()
			)
		);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.skill-popup').html());
		else
			MouseTooltip.hide();
	}
});