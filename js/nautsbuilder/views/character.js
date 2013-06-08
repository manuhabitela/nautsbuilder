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
		_.defaults(opts, { build: null, order: null, info: null, console: false });

		this.template = _.template( $('#char-tpl').html() );

		this.console = opts.console;

		this.characters = new leiminauts.CharactersView({ character: this, collection: this.collection, console: this.console });
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

		this.toggleTimeout = null;
		this.model.on('change:maxed_out', this.toggleMaxedOutView, this);
	},

	render: function() {
		var data = this.model.toJSON();
		data.console = this.console;
		this.$el.html(this.template( data ));
		this.assign(this.characters, '.chars');
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		return this;
	},

	toggleMaxedOutView: function() {
		//transitionend doesn't seem to fire reliably oO going with nasty timeouts that kinda match transition duration
		var timeOutTime = Modernizr.csstransitions ? 500 : 0;
		if (this.model.get('maxed_out')) {
			this.toggleTimeout = setTimeout(_.bind(function() {
				this.$('.upgrade:not(.active)').addClass('hidden');
			}, this), timeOutTime);
		} else{
			clearTimeout(this.toggleTimeout);
			this.$('.upgrade:not(.active)').removeClass('hidden');
		}
		setTimeout(_.bind(function() {
			this.$el.toggleClass('maxed-out', this.model.get('maxed_out'));
		}, this), 0);
	},

	toggleCompactView: function(toggle) {
		if (toggle !== undefined)
			this.$el.toggleClass('compact', !!toggle);
		else
			this.$el.toggleClass('compact', toggle);
	}
});