;(function() {
	//we update server data if it's obsolete or here since more than 2 days
	var update = leiminauts.lastServerDataUpdate < leiminauts.lastSpreadsheetUpdate;
	if (!update)
		update = (new Date().getTime() - leiminauts.lastServerDataUpdate) > (1000*60*60*24*2);
	if (update) {
		if ( $('.data-update-button').length ) {
			$('.data-update-button').attr('disabled', 'disabled');
		}

		var sheets = {
			steam: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			dev  : "0AuPP-DBESPOedHBBU1FCcWl2ZTZDSUdwM0JPcW0wV2c",
			conso: "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE"
		};
		var sheetsKey = _(sheets).keys();
		var updateDataFromSheet = function(sheet, dataz, tabletop) {
			var characters = JSON.stringify(tabletop.sheets('Characters').all());
			var skills = JSON.stringify(tabletop.sheets('Skills').all());
			var upgrades = JSON.stringify(tabletop.sheets('Upgrades').all());
			var scaling = JSON.stringify(tabletop.sheets('Scaling').all());
			var data = {sheet: sheet, characters: characters, skills: skills, upgrades: upgrades, scaling: scaling};
			$.ajax({
				type: 'POST',
				url: '../../../data/update.php',
				data: data,
				success: function(returnData, textStatus, jqXHR) { console.log(returnData); },
				complete: onSheetDataUpdated
			});
		};
		var notifyUser = function(text) {
			text = text || '';
			if ( $('.data-updated-notice').length ) {
				$('.data-updated-notice').html(text);
			}
		};
		var onSheetDataUpdated = _.after(sheetsKey.length, function() { notifyUser("The <a href=\"/\">Nautsbuilder</a>'s data is now up-to-date!"); });

		notifyUser("Updating data...");

		var updateSheet = function(sheet) {
			Tabletop.init({
				key: sheets[sheet],
				debug: true,
				callback: function(dataz, tabletop) {
					updateDataFromSheet(sheet, dataz, tabletop);
				}
			});
		};

		for (var i = sheetsKey.length - 1; i >= 0; i--) {
			updateSheet(sheetsKey[i]);
		}
	}
})();
