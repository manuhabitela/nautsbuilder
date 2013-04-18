leiminauts.Character = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.setId();
		this.on('change:name', this.setId, this);
	},

	setId: function(name) {
		name = name || this.get('name');
		if (!name) return false;
		this.set('id', _.underscored(name));
	}
});

leiminauts.CharactersData = Backbone.Collection.extend({
	model: leiminauts.Character,

	initialize: function(models, opts) {
		//treating spreadsheet data:
		//each character has skills
		//each skills has upgrades
		if (opts.spreadsheet) {
			this.spreadsheet = opts.spreadsheet;

			var characters = this.spreadsheet.sheets('Characters').all();
			var skills = this.spreadsheet.sheets('Skills').all();
			var upgrades = this.spreadsheet.sheets('Upgrades').all();
			_.each(characters, function(character) {
				_.each(skills, function(skill) {
					var skillUpgrades = _(upgrades).where({ skill: skill.name });
					skill.upgrades = new leiminauts.Upgrades(skillUpgrades);
				});
				var charSkills = _(skills).where({ character: character.name });
				character.skills = new leiminauts.Skills(charSkills);
				this.add(character);
			}, this);
			console.log(this.at(0).get('name'));
		}
	}
});