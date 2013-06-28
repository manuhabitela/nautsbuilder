/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharactersView = Backbone.View.extend({
	className: 'chars-list-container',

	events: {
		"click .char[data-id]": "selectCharacter"
	},

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.collection.on('add remove reset', this.render, this);

		if (this.options.character !== undefined)
			this.character = this.options.character.model.toJSON();
		this.console = this.options.console !== undefined ? this.options.console : false;

		this.currentChar = null;

		this.mouseOverTimeout = null;

		this.$el.on('mouseover', '.char', _.bind(_.debounce(this.showCharInfo, 50), this));
		this.$el.on('click', '.current-char', _.bind(this.reset, this));
	},

	render: function() {
		this.$el.html(this.template({ "characters": this.collection.toJSON(), "currentChar": this.currentChar, character: this.character, console: this.options.console }));
		return this;
	},

	selectCharacter: function(e) {
		this.collection.trigger('selected', $(e.currentTarget).attr('data-id'));
	},

	showCharInfo: function(e) {
		if (this.character) return false;
		var character = $(e.currentTarget).attr('title');
		if (this.currentChar === null || this.currentChar.get('name') !== character) {
			this.currentChar = this.collection.findWhere({name: character});
			this.render();
		}
	},

	reset: function(e) {
		this.currentChar = null;
		this.render();
	}
});