/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.InfoView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-info',

	events: {
		"click .forum-snippet": "focusForumSnippet",
		"change .xp-slider": "xpSliderChange",
		"change .xp-number": "xpNumberChange",
	},

	initialize: function(options) {
		this.options = options || {};
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.template = _.template( $('#info-tpl').html() );
		this.forum = this.options.forum || false;

		this.listenTo(this.character.model, 'change:total_cost', this.render);
		this.listenTo(this.character.model, 'change:xp_level', this.render);
	},

	render: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		this.$el.html(this.template(data));

		leiminauts.ev.trigger('update-specific-links');
		return this;
	},

	focusForumSnippet: function() {
		this.$('.forum-snippet').select();
	},

	xpSliderChange: function() {
		var level = Number(this.$('.xp-slider').val());
		this.model.set('xp_level', level);
	},

	xpNumberChange: function() {
		var level = Number(this.$('.xp-number').val());
		this.model.set('xp_level', level);
	}
});
