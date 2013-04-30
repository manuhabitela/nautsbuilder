leiminauts.CharactersView = Backbone.View.extend({
	className: 'chars-list-container',

	events: {
		"click .char": "selectCharacter"
	},

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.collection.on('add remove reset', this.render, this);

		this.currentChar = null;

		this.mouseOverTimeout = null;

		this.$el.on('mouseover', '.char', _.bind(_.debounce(this.showCharInfo, 200), this));
	},

	render: function() {
		$('body').attr('data-page', 'chars-list');
		this.$el.html(this.template({ "characters": this.collection.toJSON(), "currentChar": this.currentChar }));
		return this;
	},

	selectCharacter: function(e) {
		this.trigger('selected', $(e.currentTarget).attr('data-id'));
	},

	showCharInfo: function(e) {
		var character = $(e.currentTarget).attr('data-id');
		if (this.currentChar === null || this.currentChar.get('name') !== _.ununderscored(character)) {
			this.currentChar = this.collection.findWhere({name: _.ununderscored(character)});
			this.render();
		}
	}
});