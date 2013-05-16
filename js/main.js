/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
$(function() {
	FastClick.attach(document.body);
});
;(function() {
	//dev 0AuPP-DBESPOedHpYZUNPa1BSaEFVVnRoa1dTNkhCMEE
	//prod 0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE
	//opened 0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc	
	var spreadsheetKey = "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc";

	MouseTooltip.init({ "3d": true });

	//small "hack" to set the page to red background directly if we're on root
	$('html').toggleClass('page-red', !window.location.hash.length);

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", spreadsheet: false });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false});
	};

	leiminauts.lastDataUpdate = leiminauts.lastDataUpdate || 0;
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.date') ? localStorage.getItem('nautsbuilder.date') : 0;

	if (leiminauts.lastDataUpdate === 0 || leiminauts.lastDataUpdate > leiminauts.localDate) {
		Tabletop.init({
			key: spreadsheetKey,
			callback: function(data, tabletop) {
				leiminauts.init({ spreadsheet: tabletop });
			}
		});
	} else {
		var dataOk = true;
		if (Modernizr.localstorage) {
			var characters = localStorage.getItem('nautsbuilder.characters');
			var skills = localStorage.getItem('nautsbuilder.skills');
			var upgrades = localStorage.getItem('nautsbuilder.upgrades');
			_([characters, skills, upgrades]).each(function(data) {
				if (!data || data === "undefined") {
					dataOk = false;
					return false;
				}
			});
			if (dataOk) {
				leiminauts.init({});
			}
		}
		if (!Modernizr.localstorage || !dataOk) {
			Tabletop.init({
				key: spreadsheetKey,
				callback: function(data, tabletop) {
					leiminauts.init({ spreadsheet: tabletop });
				}
			});
		}
	}
}());