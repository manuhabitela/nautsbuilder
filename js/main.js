MouseTooltip.init();
//dev 0AuPP-DBESPOedHpYZUNPa1BSaEFVVnRoa1dTNkhCMEE
//prod 0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE
//opened 0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc
Tabletop.init({
	key: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
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