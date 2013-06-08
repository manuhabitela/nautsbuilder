/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#order-tpl').html() );

		this.active = true;

		this.forum = this.options.forum;

		this.on('toggled', this.toggleView, this);

		this.collection = new Backbone.Collection(null, { comparator: this.comparator });

		this.collection.on('reset', this.onBuildChange, this);

		this.model.get('skills').each(
			_.bind(function(skill) {
				skill.get('upgrades').on('change:current_step', this.onBuildChange, this);
			}, this)
		);
		this.model.get('skills').on('change:active', this.onBuildChange, this);

		this.on('sorted', this.render, this);
	},

	toggle: function() {
		this.active = !this.active;
		this.trigger('toggled');
	},

	toggleView: function() {
		if (!this.$el) return false;
		this.$el.find('ul').toggleClass('hidden', !this.active);
		this.$el.find('input[name="active"]').prop('checked', this.active);
	},

	onBuildChange: function(model) {
		this.updateCollection(model);
		this.render();
	},

	comparator: function(model) {
		return model.get('order') || 0;
	},

	render: function() {
		var data = this.collection.toJSON();
		var totalCost = 0;
		_(data).each(function(item) {
			totalCost += item.upgrade ? item.upgrade.cost*1 : item.cost*1;
			item.order_total_cost = totalCost;
			item.order_req_lvl = Math.floor((totalCost-100)/100) <= 1 ? 1 : Math.floor((totalCost-100)/100);
		});
		this.$el.html(this.template({ items: data, active: this.active, forum: this.forum }));

		this.$('.order-item').on('mouseover mouseout click dragstart', this.handleTooltip);
		if (!this.forum) {
			this.$('input[name="active"]').on('change', _.bind(this.toggle, this));
			this.$list = this.$el.children('ul').first();
			this.$list.sortable({items: '.order-item'});
			this.$list.on('sortupdate', _.bind(this.updateOrder, this));
		}
		this.toggleView();
		return this;
	},

	updateCollection: function(model) {
		if (model instanceof leiminauts.Skill) {
			if (model.get('active'))
				this.collection.add(model, { sort: false });
			else
				this.collection.remove(model);
		} else if (model instanceof leiminauts.Upgrade) {
			var lvl = model.get('current_step').get('level');
			var steps = this.collection.filter(function(item) {
				return item instanceof leiminauts.Step && item.get('upgrade').name == model.get('name');
			});
			if (lvl !== 0) {
				if (lvl > 1 && !steps.length) {
					var toAdd = [];
					model.get('steps').each(function(step) {
						if (step.get('level') < lvl)
							toAdd.push(step);
					});
					this.collection.add(toAdd, { sort: false });
				} else
					this.collection.add(model.get('current_step'), { sort: false });
			} else {
				this.collection.remove(steps);
			}
		}
		if (this.active)
			this.trigger('changed', this.collection);
	},

	updateOrder: function() {
		if (!this.$list) return false;
		this.$list.children().each(_.bind(function(i, item) {
			this.collection.get($(item).attr("data-cid")).set('order', i, { silent: true });
		}, this));
		this.collection.sort();
		if (this.active) {
			this.trigger('changed', this.collection);
			this.trigger('sorted', this.collection);
		}
		return false;
	},

	handleTooltip: function(e) {
		if (e.type == "mouseover")
			MouseTooltip.show($(e.currentTarget).find('.order-popup').html());
		else
			MouseTooltip.hide();
	}
});