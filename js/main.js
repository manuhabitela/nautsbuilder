/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
;(function() {
	MouseTooltip.init({ "3d": true });

	//small "hack" to set the page to red background directly if we're on root
	$('body').toggleClass('page-red', !window.location.hash.length);

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", spreadsheet: false });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false, root: "/nautsbuilder/"});
	};

	leiminauts.lastDataUpdate = new Date("April 30, 2013 09:00:00 GMT+0200");
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.date') || 0;
	leiminauts.localDate = 0; //while dev

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