/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
$(function() {
	FastClick.attach(document.body);
});
;(function() {
	var consolenauts = window.location.hash.indexOf('console') !== -1;
	var forum = window.location.hash.indexOf('forum') !== -1;

	var dev = window.location.hostname === "localhost";
	//steam 0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc
	//dev   0AuPP-DBESPOedGZHb1Ata1hKdFhSRHVzamN0WVUwMWc
	//conso 0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE
	var spreadsheetKey = !dev ? "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc" : "0AuPP-DBESPOedGZHb1Ata1hKdFhSRHVzamN0WVUwMWc";
	var spreadsheetType = !dev ? "steam" : "dev";
	if (!dev && consolenauts) {
		spreadsheetKey = "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE";
		spreadsheetType = 'conso';
	}

	MouseTooltip.init({ "3d": true });

	//small "hack" to set the page to red background directly if we're on root
	$('html').toggleClass('page-red', !window.location.hash.length);

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", spreadsheet: false, console: consolenauts, forum: forum });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false});
	};

	leiminauts.lastDataUpdate = leiminauts.lastDataUpdate || 0;
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.date') ? localStorage.getItem('nautsbuilder.date') : 0;

	var dataUrl = function(type) { return './json/' + spreadsheetType + '-' + type + '.json'; };
	if (consolenauts || (leiminauts.lastDataUpdate === 0 || leiminauts.lastDataUpdate > leiminauts.localDate)) {
		$.when($.get(dataUrl('characters')), $.get(dataUrl('upgrades')), $.get(dataUrl('skills'))).done(function(chars, ups, sks) {
			leiminauts.init({ spreadsheet: {characters: chars[0], skills: sks[0], upgrades: ups[0]}, console: consolenauts });
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
			$.when($.get(dataUrl('characters')), $.get(dataUrl('upgrades')), $.get(dataUrl('skills'))).done(function(chars, ups, sks) {
				leiminauts.init({ spreadsheet: {characters: chars[0], skills: sks[0], upgrades: ups[0]}, console: false });
			});
		}
	}
}());