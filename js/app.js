leiminauts.App = Backbone.Router.extend({
	routes: {
		"naut/:naut": "build-naut",
		"build/:build": "view-build"
	},

	initialize: function(options) {
		this.$el = $(options.el);
		this.characters = new leiminauts.Characters();
		this.charactersView = new leiminauts.CharactersView({
			collection: this.characters });

		this.characters.fetch();


		this.$el.append( this.charactersView.el );
	}
});

$(function() {
	leiminauts.app = new leiminauts.App({
		el: '#container'
	});
});