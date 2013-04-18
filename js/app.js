_.mixin({
	underscored : function(string) {
		if (!_.isString(string)) return false;
		return string.toLowerCase().replace(' ', '_');
	}
});

leiminauts.App = Backbone.Router.extend({
	routes: {
		"": "list",
		":naut(/:build)(/:order)": "buildMaker"
	},

	initialize: function(options) {
		if (options.spreadsheet) {
			this.datab = new leiminauts.CharactersData(null, { spreadsheet: options.spreadsheet });
		}
		this.$el = $(options.el);
	},

	list: function() {
		var charsView = new leiminauts.CharactersView({
			collection: this.datab
		});
		charsView.on('selected', function(naut) {
			this.navigate(naut, { trigger: true });
		}, this);
		this.showView( charsView );
	},

	buildMaker: function(naut, build, order) {
		var charView = new leiminauts.CharacterView({
			model: this.datab.findWhere({ id: _.underscored(naut) }),
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



leiminauts.init = function(data, tabletop) {
	leiminauts.app = new leiminauts.App({
		el: '#container',
		spreadsheet: tabletop
	});
	Backbone.history.start({pushState: false, root: "/nautsbuilder/"});
};

leiminauts.spreadsheet = Tabletop.init({
	key: "0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE",
	wait: false,
	debug: true,
	callback: leiminauts.init
});
