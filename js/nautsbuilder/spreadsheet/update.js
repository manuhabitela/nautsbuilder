;(function() {
	//we update server data if it's obsolete or here since more than 2 days
	var update = leiminauts.lastServerDataUpdate < leiminauts.lastDataUpdate;
	if (!update)
		update = (new Date().getTime() - leiminauts.lastServerDataUpdate) > (1000*60*60*24*2);
	if (update) {
		var sheets = {
			steam: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			dev  : "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			conso: "0AuPP-DBESPOedHJTeGo4QUZsY0hiUThaRWg1eUJrZFE"
		};

		var sheetsKey = _(sheets).keys();
		for (var i = sheetsKey.length - 1; i >= 0; i--) {
			var sheet = sheetsKey[i];
			(function(sheet) {
				Tabletop.init({
					key: sheets[sheet],
					debug: true,
					callback: function(dataz, tabletop) {
						var characters = JSON.stringify(tabletop.sheets('Characters').all());
						var skills = JSON.stringify(tabletop.sheets('Skills').all());
						var upgrades = JSON.stringify(tabletop.sheets('Upgrades').all());
						var data = {sheet: sheet, characters: characters, skills: skills, upgrades: upgrades};
						$.ajax({
							type: 'POST',
							url: '../../../data/update.php',
							data: data
						});
						if (Modernizr.localstorage)
							localStorage.removeItem('nautsbuilder.' + sheet + '.date');
					}
				});
			})(sheet);
		}


	}
})();