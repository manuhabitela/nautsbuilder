leiminauts.CharactersView = Backbone.View.extend({
	tagName: 'ul',

	className: 'chars-list',

	events: {
		"click .char": "selectCharacter"
	},

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.collection.on('add remove reset', this.render, this);
	},

	render: function() {
		this.$el.html(this.template({ "characters": this.collection.toJSON() }));
		return this;
	},

	selectCharacter: function(e) {
		this.trigger('selected', $(e.currentTarget).attr('data-id'));
	}
});