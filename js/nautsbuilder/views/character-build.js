/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.BuildView = Backbone.View.extend({
	tagName: 'div',

	className: 'build',

	events: {
		"click .build-cancel": "reset"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.skills = [];
		this.model.get('skills').each(function(skill) {
			this.skills.push(new leiminauts.SkillView({ model: skill }));
		}, this);

		this.template = _.template( $('#build-tpl').html() );

		//not that good to put this here but YOLO
		this.model.get('skills').on('change:active', this.toggleResetButtonClass, this);
		this.model.get('skills').each(_.bind(function(skill) { skill.get('upgrades').on('change:active', this.toggleResetButtonClass, this); }, this));
		this.toggleResetButtonClass();
	},

	//not that good to put this here but YOLO
	toggleResetButtonClass: function() {
		if (!this.$resetButton) return false;

		var active = false;
		this.model.get('skills').each(function(skill) {
			if ( (skill.get('active') && skill.get('toggable')) || skill.getActiveUpgrades().length > 0) {
				active = true;
				return false;
			}
		});
		this.$resetButton.toggleClass('active', active);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.$resetButton = this.$('.build-cancel');
		_(this.skills).each(function(skill) {
			skill.delegateEvents();
			this.$el.append(skill.render().el);
		}, this);
		return this;
	},

	reset: function() {
		this.model.get('skills').each(function(skill) {
			skill.setActive(false);
			if (!skill.get('toggable'))
				skill.updateUpgradesState(false);
		});
	}
});