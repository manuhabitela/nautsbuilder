leiminauts.App = Backbone.Router.extend({
	routes: {
		"": "list",
		":naut(/:build)(/:order)": "buildMaker"
	},

	initialize: function(options) {
		if (options.spreadsheet !== undefined) {
			this.data = new leiminauts.CharactersData(null, { spreadsheet: options.spreadsheet });
		}
		this.$el = $(options.el);
	},

	list: function() {
		var charsView = new leiminauts.CharactersView({
			collection: this.data
		});
		charsView.on('selected', function(naut) {
			this.navigate(naut, { trigger: true });
		}, this);
		this.showView( charsView );
	},

	buildMaker: function(naut, build, order) {
		var charView = new leiminauts.CharacterView({
			model: this.data.findWhere({ name: _.capitalized(naut) }),
			build: build || null,
			order: order || null
		});
		this.showView( charView );
	},

	showView: function(view) {
		if (this.currentView)
			this.currentView.remove();
		this.$el.html(view.render().el);
		this.currentView = view;
		return view;
	}
});