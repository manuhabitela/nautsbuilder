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
		"submit .fav-add": "addFavorite",
		"click .fav-add-submit": "toggleFavorite",
		"blur .fav-add-name": "addFavorite"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.favorites = this.options.favorites;

		this.template = _.template( $('#info-tpl').html() );

		this.forum = this.options.forum || false;

		this.listenTo(this.character.model, 'change:total_cost', this.render);
		this.listenTo(this.favorites, 'change add remove', this.render);
	},

	render: function() {
		var data = this.model.toJSON();
		data.forum = this.forum;
		data.favorite = this.favorites.findWhere({ hash: window.location.hash.substr(1) });
		if (data.favorite) data.favorite = data.favorite.toJSON();
		this.$el.html(this.template(data));

		leiminauts.ev.trigger('update-specific-links');
		return this;
	},

	focusForumSnippet: function() {
		this.$('.forum-snippet').select();
	},

	getFavoriteData: function() {
		return {
			hash: window.location.hash.substr(1),
			name: this.$('.fav-add-name').val(),
			character: _(this.character.model.toJSON()).pick('name', 'icon')
		};
	},

	toggleFavorite: function(e) {
		e.preventDefault();
		leiminauts.ev.trigger('toggle-favorite', this.getFavoriteData());
	},

	addFavorite: function(e) {
		e.preventDefault();
		leiminauts.ev.trigger('add-favorite', this.getFavoriteData());
	}
});