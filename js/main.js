MouseTooltip.init();

Tabletop.init({
	key: "0AuPP-DBESPOedHpYZUNPa1BSaEFVVnRoa1dTNkhCMEE",
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

//offline mode
// window.nautsbuilder = new leiminauts.App({
// 	el: '#container',
// 	spreadsheet: false
// });
// Backbone.history.start({pushState: false, root: "/nautsbuilder/"});