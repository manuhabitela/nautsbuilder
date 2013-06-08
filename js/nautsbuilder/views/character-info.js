/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.InfoView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-info',

	events: {
		"click .forum-snippet": "focusForumSnippet"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#info-tpl').html() );

		this.forum = this.options.forum || false;

		this.model.on('change:total_cost', this.render, this);
	},

	render: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		this.$el.html(this.template( data ));
		return this;
	},

	focusForumSnippet: function() {
		this.$('.forum-snippet').select();
	}
});