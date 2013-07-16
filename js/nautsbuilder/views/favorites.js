/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.FavoritesView = Backbone.View.extend({
	className: 'favorites-list-container',

	events: {
		"click .fav-delete": "deleteFavorite"
	},

	initialize: function() {
		if (!Modernizr.localstorage)
			return false;
		this.template = _.template( $('#favs-tpl').html() );
		this.listenTo(this.collection, 'add remove reset', this.render);

		this.characters = new leiminauts.CharactersView({ collection: this.options.characters, console: this.options.console, mini: true });
	},

	render: function() {
		this.$el.html(this.template({ "favorites": this.collection.toJSON() }));
		this.assign(this.characters, '.chars');
		return this;
	},

	deleteFavorite: function(e) {
		var favHash = $(e.currentTarget).siblings('.fav-name').attr('href').substr(1);
		var fav = this.collection.findWhere({ hash: favHash });
		if (fav)
			this.collection.removeFromStorage(fav);
	}
});