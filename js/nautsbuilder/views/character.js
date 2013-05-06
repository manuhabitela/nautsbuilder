/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null, info: null });

		this.template = _.template( $('#char-tpl').html() );

		this.characters = new leiminauts.CharactersView({ character: this, collection: this.collection });
		this.build = new leiminauts.BuildView({ character: this });
		this.info = new leiminauts.InfoView({ character: this });
		this.order = new leiminauts.OrderView({ character: this });

		this.order.on('changed', function(collection) {
			this.trigger('order:changed', collection);
		}, this);

		this.order.on('toggled', function() {
			this.trigger('order:toggled');
		}, this);

		this.render();

		this.model.on('change:maxed_out', this.toggleCompactView, this);
	},

	render: function() {
		$('body').attr('data-page', 'char');
		this.$el.html(this.template( this.model.toJSON() ));
		this.assign(this.characters, '.chars');
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		return this;
	},

	toggleCompactView: function() {
		this.$el.toggleClass('maxed-out', this.model.get('maxed_out'));
	}
});