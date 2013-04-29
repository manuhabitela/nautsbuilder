leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		this.set('totalCost', 0);
		this.set('level', 0);
		this.get('skills').on('change:totalCost', this.onCostChange, this);
	},

	onCostChange: function() {
		var cost = 0;
		this.get('skills').each(function(skill) {
			cost += skill.get('totalCost');
		});
		this.set('level', Math.floor( (cost-100)/100) <= 0 ? 0 : Math.floor((cost-100)/100));
		this.set('totalCost', cost);
	}
});

/**
 * this is our full "database"
 * we have a characters list > each character has skills > each skills has upgrades
 *
 * you must pass the tabletop object which contains the google spreadsheet with all the data in the options at initialization
 */
leiminauts.CharactersData = Backbone.Collection.extend({
	model: leiminauts.Character,

	initialize: function(models, opts) {
		//treating spreadsheet data:
		//each character has skills
		//each skills has upgrades
		if (opts.spreadsheet !== undefined) {
			this.spreadsheet = opts.spreadsheet;

			var characters, skills, upgrades;
			if (this.spreadsheet) {
				characters = this.spreadsheet.sheets('Characters').all();
				skills = this.spreadsheet.sheets('Skills').all();
				upgrades = this.spreadsheet.sheets('Upgrades').all();
			} else {
				characters = nautsbuilderoffline.characters;
				skills = nautsbuilderoffline.skills;
				upgrades = nautsbuilderoffline.upgrades;
			}
			_.each(characters, function(character) {
				_.each(skills, function(skill) {
					var skillUpgrades = [];
					//the jump skill has common upgrades, but also some custom ones sometimes
					if (skill.type == "jump") {
						skillUpgrades = _(upgrades).where({ skill: "Jump" });
						//some chars have turbo pills, others have light; we remove the one unused
						var jumpEffects = leiminauts.utils.treatEffects(skill.effects);
						var pills = _(jumpEffects).findWhere({key: "pills"});
						var unwantedPills = "Power Pills Light";
						if (pills && pills.value == "light") {
							unwantedPills = "Power Pills Turbo";
						}
						skillUpgrades.splice( _(skillUpgrades).indexOf( _(skillUpgrades).findWhere({ name: unwantedPills }) ), 1 );

						//some chars have unique jump upgrades that replace common ones
						var customJumpUpgrades = _(upgrades).where({ skill: skill.name });
						_(skillUpgrades).each(function(upgrade, i) {
							_(customJumpUpgrades).each(function(jupgrade) {
								if (jupgrade.replaces == upgrade.name)
									skillUpgrades[i] = _(jupgrade).clone();
							});
						});
					} else {
						skillUpgrades = _(upgrades).where({ skill: skill.name });
					}
					skill.upgrades = new leiminauts.Upgrades(skillUpgrades);
				});
				var charSkills = _(skills).where({ character: character.name });
				character.skills = new leiminauts.Skills(charSkills);
				this.add(character);
			}, this);
		}
	}
});