MouseTooltip.init();

Tabletop.init({
	key: "0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE",
	wait: false,
	debug: true,
	callback: function(data, tabletop) {
		window.nautsbuilder = new leiminauts.App({
			el: '#container',
			spreadsheet: tabletop
		});
		Backbone.history.start({pushState: false, root: "/nautsbuilder/"});
	}
});