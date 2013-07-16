/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Favorites = Backbone.Collection.extend({
	initialize: function(models, opts) {
		this.options = _(opts).defaults(this.defaults);

		this.localStorage = new Backbone.LocalStorage("nautsbuilder.favorites");

		this.fetch();
	},

	addToStorage: function(data) {
		var existing = this.findWhere({ hash: data.hash });
		if (existing) {
			this.get(existing).save(data);
		}
		else {
			this.create(data);
		}
	},

	removeFromStorage: function(favorite) {
		favorite.destroy();
		this.remove(favorite);
	},

	toggle: function(data) {
		var existing = this.findWhere({ hash: data.hash });
		return existing ? this.removeFromStorage(existing) : this.addToStorage(data);
	}
});