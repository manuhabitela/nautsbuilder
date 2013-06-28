/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
		"click .char-forum-switch button": "toggleForumViews"
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null, info: null, console: false, forum: false });

		this.template = _.template( $('#char-tpl').html() );

		this.console = opts.console;
		this.forum = opts.forum;

		this.characters = new leiminauts.CharactersView({ character: this, collection: this.collection, console: this.console });
		this.build = new leiminauts.BuildView({ character: this, forum: this.forum });
		this.info = new leiminauts.InfoView({ character: this, forum: this.forum });
		this.order = new leiminauts.OrderView({ character: this, forum: this.forum });

		this.order.on('changed', function(collection) {
			this.trigger('order:changed', collection);
		}, this);

		this.order.on('toggled', function() {
			this.trigger('order:toggled');
		}, this);

		if (this.forum)
			this.order.collection.on('add remove reset', this.toggleForumTabs, this);

		this.render();

		this.toggleTimeout = null;
		this.model.on('change:maxed_out', this.toggleMaxedOutView, this);
	},

	render: function() {
		var data = this.model.toJSON();
		data.console = this.console;
		data.forum = this.forum;
		this.$el.html(this.template( data ));
		this.assign(this.characters, '.chars');
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		if (this.forum)
			this.toggleForumViews(null, 'build');
		return this;
	},

	toggleMaxedOutView: function() {
		//transitionend doesn't seem to fire reliably oO going with nasty timeouts that kinda match transition duration
		if (!this.forum) {
			var timeOutTime = Modernizr.csstransitions ? 500 : 0;
			if (this.model.get('maxed_out')) {
				this.toggleTimeout = setTimeout(_.bind(function() {
					this.$('.upgrade:not(.active)').addClass('hidden');
				}, this), timeOutTime);
			} else{
				clearTimeout(this.toggleTimeout);
				this.$('.upgrade:not(.active)').removeClass('hidden');
			}
		}
		setTimeout(_.bind(function() {
			this.$el.toggleClass('maxed-out', this.model.get('maxed_out'));
			this.$('.forum-snippet').attr('rows', this.model.get('maxed_out') ? 6 : 1);
		}, this), 0);
	},

	toggleForumViews: function(e, forcedClass) {
		forcedClass = forcedClass || null;
		itemClass = forcedClass ? forcedClass : $(e.currentTarget).attr('data-item');
		this.$('.char-forum-switch button').removeClass('switch-active');
		if (e)
			$(e.currentTarget).addClass('switch-active');
		if (forcedClass)
			this.$('.char-forum-switch button[data-item="' + forcedClass + '"]').addClass('switch-active');
		this.$('.build').toggleClass('forum-hidden', itemClass != 'build');
		this.$('.order').toggleClass('forum-hidden', itemClass != 'order');
	},

	toggleForumTabs: function() {
		this.$('.char-forum-switch').toggleClass('forum-hidden', this.order.collection.length);
	}
});