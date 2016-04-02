/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		this.skills = this.get('skills');
		this.set('total_cost', 0);
		this.set('maxed_out', false);
		this.set('xp_level', 1);
		this.listenTo(this.skills, 'change:total_cost', this.onCostChange);
		this.listenTo(this.skills, 'change:maxed_out', this.onSkillComplete);

		this.on('change:selected', this.onSelectedChange, this);
	},

	onCostChange: function() {
		var cost = 0;
		this.skills.each(function(skill) {
			cost += skill.get('total_cost');
		});
		this.set('total_cost', cost);
	},

	onSkillComplete: function() {
		var maxed = true;
		_(this.skills.pluck('maxed_out')).each(function(max) {
			if (!max) {
				maxed = false;
				return false;
			}
		});
		this.set('maxed_out', maxed);
	},

	onSelectedChange: function() {
		this.skills.each(function(skill) {
			skill.set('selected', this.get('selected'));
		}, this);
	},

	reset: function() {
		this.skills.each(function(skill) {
			skill.setActive(false);
			if (!skill.get('toggable'))
				skill.resetUpgradesState(false);
		}, this);
	}
});

/**
 * this is our full "database"
 * we have a characters list > each character has skills > each skills has upgrades
 */
leiminauts.CharactersData = Backbone.Collection.extend({
	model: leiminauts.Character,

	initialize: function(models, opts) {
		//each character has skills
		//each skills has upgrades
		if (opts.data !== undefined) {
			this.data = opts.data;
			this.console = opts.console || false;

			if (this.data) {
				leiminauts.characters = this.data.characters;
				leiminauts.skills = this.data.skills;
				leiminauts.upgrades = this.data.upgrades;
				leiminauts.scaling = this.data.scaling;

				_.each(leiminauts.characters, function(character) {
					var charSkills = _(leiminauts.skills).where({ character: character.name });
					character.skills = new leiminauts.Skills(charSkills);
					var characterModel = new leiminauts.Character(character);

					// Set reference from each skill back to character
					character.skills.each(function(skill) {
						skill.set('character', characterModel);
						skill.character = skill.get('character');
					});

					this.add(characterModel);
				}, this);
			}
		}
	}
});
