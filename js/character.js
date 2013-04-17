window.leiminauts = window.leiminauts || {};
leiminauts.spreadsheet = Tabletop.init({
	key: "0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE",
	wait: true,
	debug: true
});

leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		if (this.options.skills)
			this.skills = this.options.skills;
	}
});

leiminauts.Characters = Backbone.Collection.extend({
	tabletop: {
		instance: leiminauts.spreadsheet,
		sheet: "Characters"
	},
	sync: Backbone.tabletopSync,
	model: leiminauts.Character
});

leiminauts.CharactersView = Backbone.View.extend({
	tagName: 'ul',

	className: 'chars-list',

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.collection.on('add remove reset', this.render, this);
	},

	render: function() {
		this.$el.html(this.template({ "characters": this.collection.toJSON() }));
		return this;
	}
});