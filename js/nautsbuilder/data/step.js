/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Step = Backbone.Model.extend({
	defaults: {
		level: 0,
		description: ''
	},

	initialize: function() {
		//description is a string showing the list of effects the step gives.
		var effects = leiminauts.effect.effectsFromString(this.get('description'));
		this.set('effects', effects);
		this.updateDescription();
	},

	updateDescription: function() {
		this.set('description', this.get('description').replace(/: @/g, ': '));
	}
});

leiminauts.Steps = Backbone.Collection.extend({
	model: leiminauts.Step
});