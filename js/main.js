/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

/**
 * loading necessary libs
 */
$(function() {
	FastClick.attach(document.body);
	MouseTooltip.init({ "3d": true });
	//small "hack" to set the page to red background directly if we're on root
	$('html').toggleClass('page-red', !window.location.hash.length);
});

/**
 * initialize Nautsbuilder
 */
;(function() {
	var forum = window.location.hash.indexOf('forum') !== -1;

	var consolenauts = window.location.hash.indexOf('console') !== -1;
	var dev = window.location.hostname === "localhost";
	leiminauts.sheets = [
		{ name: "steam", key: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc" },
		{ name: "dev", key: "0AuPP-DBESPOedGZHb1Ata1hKdFhSRHVzamN0WVUwMWc" },
		{ name: "conso", key: "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE" }
	];
	var spreadsheet = _(leiminauts.sheets).findWhere({ name: (dev ? "dev" : (consolenauts ? "conso" : "steam") ) });
	leiminauts.spreadsheet = spreadsheet;

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", data: false, console: consolenauts, forum: forum });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false});
	};
	var dataUrl = function(type) { return './data/' + spreadsheet.name + '-' + type + '.json'; };
	var loadData = function() {
		$.when(
			$.ajax({url: dataUrl('characters'), dataType: "json"}),
			$.ajax({url: dataUrl('upgrades'), dataType: "json"}),
			$.ajax({url: dataUrl('skills'), dataType: "json"})
		).done(function(chars, ups, sks) {
			var data = { characters: chars[0], skills: sks[0], upgrades: ups[0] };
			if (Modernizr.localstorage && !dev) {
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.characters', JSON.stringify(data.characters));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.skills', JSON.stringify(data.skills));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.upgrades', JSON.stringify(data.upgrades));
				localStorage.setItem('nautsbuilder.' + spreadsheet.name + '.date', new Date().getTime());
			}
			leiminauts.init({ data: data });
		});
	};

	//Here we define what data to load - steam, dev, console? and from where - localStorage, server?
	leiminauts.lastDataUpdate = leiminauts.lastDataUpdate || 0;
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.date') ?
		localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.date') :
		0;

	if (dev || leiminauts.lastDataUpdate === 0 || leiminauts.lastDataUpdate > leiminauts.localDate) {
		loadData();
	} else {
		var dataOk = true;
		if (Modernizr.localstorage) {
			var characters = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.characters');
			var skills = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.skills');
			var upgrades = localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.upgrades');
			_([characters, skills, upgrades]).each(function(data) {
				if (!data || data === "undefined") {
					dataOk = false;
					return false;
				}
			});
			if (dataOk) {
				var data = {};
				data.characters = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.characters'));
				data.skills = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.skills'));
				data.upgrades = JSON.parse(localStorage.getItem('nautsbuilder.' + spreadsheet.name + '.upgrades'));

				leiminauts.init({ data: data });
			}
		}
		if (!Modernizr.localstorage || !dataOk) {
			loadData();
		}
	}
}());