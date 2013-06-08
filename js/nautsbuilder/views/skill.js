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
		this.forum = this.options.forum || false;

		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade, forum: this.forum }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );

		this.model.get('upgrades').on('change', this.renderUpgradesInfo, this);

		this.model.on('change', this.render, this);
	},

	toggleState: function() {
		if (this.forum) return false;
		this.model.setActive(!this.model.get('active'));
	},

	reset: function() {
		this.model.setActive(false);
		if (!this.model.get('toggable'))
			this.model.resetUpgradesState(false);
	},

	//that's *really* not good to handle this like that but gah - i'm tired
	//(I don't want the upgrades to rebuild each time we render, it's useless and doesn't permit to use cool animations on compact/full view toggle
	render: function() {
		var data = this.model.toJSON();
		if (!this.$el.html()) {
			this.$el.html(this.template( data ));
			_(this.upgrades).each(function(upgrade) {
				upgrade.delegateEvents();
				this.$('.skill-upgrades').append(upgrade.render().el);
			}, this);
		} else {
			this.$('.skill').toggleClass('active', data.active);
			this.$('.skill').toggleClass('skill-maxed-out', data.maxed_out);
			this.$('.skill-effects').toggleClass('hidden', !data.effects.length);
			this.$('.skill-cancel').toggleClass('active', (data.toggable && data.active) || (data.upgrades.where({ active: true }).length > 0));
			_(this.upgrades).invoke('delegateEvents');
		}
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