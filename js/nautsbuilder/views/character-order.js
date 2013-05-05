/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	events: {
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#order-tpl').html() );

		this.collection = new Backbone.Collection(null, { comparator: this.comparator });

		this.model.get('skills').each(
			_.bind(function(skill) {
				skill.get('upgrades').on('change:current_step', this.onBuildChange, this);
			}, this)
		);
		this.model.get('skills').on('change:active', this.onBuildChange, this);
	},

	onBuildChange: function(model) {
		this.updateCollection(model);
		this.render();
	},

	comparator: function(model) {
		return model.get('order') || 0;
	},

	render: function() {
		this.$el.html(this.template( {items: this.collection.toJSON()} ));
		this.$list = this.$el.children('ul').first();
		this.$list.sortable({items: '.order-item'});
		this.$list.on('sortupdate', _.bind(this.updateOrder, this));
		return this;
	},

	updateCollection: function(model) {
		if (model instanceof leiminauts.Skill)
			this.collection[model.get('active') ? 'add' : 'remove'](model);
		else if (model instanceof leiminauts.Upgrade) {
			if (model.get('current_step').get('level') !== 0)
				this.collection.add(model.get('current_step'), { sort: false });
			else {
				var steps = this.collection.filter(function(item) {
					return item instanceof leiminauts.Step && item.get('upgrade').name == model.get('name');
				});
				this.collection.remove(steps);
			}
		}
	},

	updateOrder: function() {
		if (!this.$list) return false;
		this.$list.each(_.bind(function(i, item) {
			this.collection.get($(item).attr("data-cid")).set('order', i, { silent: true });
		}, this));
		this.collection.sort();
		return false;
	}
});