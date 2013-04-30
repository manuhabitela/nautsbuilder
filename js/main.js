;(function() {
	MouseTooltip.init();

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", spreadsheet: false });
		console.log(opts);
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false, root: "/nautsbuilder/"});
	};

	leiminauts.lastDataUpdate = new Date("April 30, 2013 09:00:00 GMT+0200");
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.date') || 0;

	if (leiminauts.lastDataUpdate.getTime() > leiminauts.localDate) {
		//dev 0AuPP-DBESPOedHpYZUNPa1BSaEFVVnRoa1dTNkhCMEE
		//prod 0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE
		//opened 0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc
		Tabletop.init({
			key: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			wait: false,
			debug: false,
			callback: function(data, tabletop) {
				leiminauts.init({ spreadsheet: tabletop });
			}
		});
	} else {
		leiminauts.init({});
	}
}());