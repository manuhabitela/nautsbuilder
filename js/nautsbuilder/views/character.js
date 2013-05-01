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

		this.model.get('skills').each(function(skill) {
			skill.initUpgrades();
		});

		this.template = _.template( $('#char-tpl').html() );

		this.build = new leiminauts.BuildView({ character: this, state: opts.build });
		this.info = new leiminauts.InfoView({ character: this, state: opts.info });
		this.order = new leiminauts.OrderView({ character: this, state: opts.order });

		this.render();
	},

	render: function() {
		$('body').attr('data-page', 'char');
		this.$el.html(this.template( this.model.toJSON() ));
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		return this;
	}
});