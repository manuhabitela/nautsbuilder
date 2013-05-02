/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.App = Backbone.Router.extend({
	routes: {
		"": "list",
		":naut(/:build)(/:order)": "buildMaker",
		":naut/": "buildMaker"
	},

	initialize: function(options) {
		if (options.spreadsheet !== undefined) {
			this.data = new leiminauts.CharactersData(null, { spreadsheet: options.spreadsheet });
			this.data.on('selected', function(naut) {
				this.navigate(naut, { trigger: true });
			}, this);
		}
		this.$el = $(options.el);
	},

	list: function() {
		$('body').removeClass('page-blue').addClass('page-red');
		var charsView = new leiminauts.CharactersView({
			collection: this.data
		});
		this.showView( charsView );
	},

	buildMaker: function(naut, build, order) {
		$('body').addClass('page-blue').removeClass('page-red');
		var character = this.data.filter(function(character) {
			return character.get('name').toLowerCase() ==  _.ununderscored(naut).toLowerCase();
		});
		if (character.length) character = character[0]; else return false;
		var others = this.data.reject(function(other) { _(other).isEqual(character); });
		_(others).each(function(other) { other.set('selected', false); });
		var charView = new leiminauts.CharacterView({
			collection: this.data,
			model: character,
			build: build || null,
			order: order || null
		});
		this.showView( charView );

		this.updateBuildFromUrl(character);
		character.get('skills').on('change', _.bind(function() { this.updateBuildUrl(character); }, this), this);
		this.updateBuildUrl(character);
	},

	showView: function(view) {
		if (this.currentView)
			this.currentView.remove();
		this.$el.html(view.render().el);
		this.currentView = view;
		return view;
	},

	updateBuildFromUrl: function(character) {
		var currentUrl = this.getCurrentUrl();
		var urlParts = currentUrl.split('/');
		var build = urlParts.length > 1 ? urlParts[1] : null;
		if (build === null) { //reset
			character.get('skills').each(function(skill) {
				skill.get('upgrades').each(function(upgrade) {
					upgrade.setStep(0);
				});
				skill.setActive(false);
			});
			return false;
		}
		var currentSkill = null;
		//we look at the build as a grid: 4 skills + 6 upgrades by skills = 28 items
		//each line of the grid contains 7 items, the first one being the skill and the others the upgrades
		for (var i = 0; i < 28; i++) {
			if (i % 7 === 0) { //it's a skill!
				currentSkill = character.get('skills').at(i/7);
				currentSkill.setActive(build.charAt(i) === "1");
			} else if (currentSkill) { //it's an upgrade!
				currentSkill.get('upgrades').at( (i % 7) - 1 ).setStep(build.charAt(i));
			}
		}
	},

	updateBuildUrl: function(character) {
		var buildUrl = "";
		character.get('skills').each(function(skill) {
			buildUrl += skill.get('active') ? "1" : "0";
			skill.get('upgrades').each(function(upgrade) {
				buildUrl += upgrade.get('current_step').get('level');
			});
		});

		var currentUrl = this.getCurrentUrl();
		var newUrl = '';
		//maybe this shit could be better done with a regex?
		if (currentUrl.indexOf('/') === -1) //if url is like #leon_chameleon
			newUrl = currentUrl + '/' + buildUrl;
		else {
			newUrl = currentUrl.substring(0, currentUrl.indexOf('/') + 1) + buildUrl;
			if (currentUrl.indexOf('/') !== currentUrl.lastIndexOf('/')) //if like #leon_chameleon/1102032011102/0-2-3-12-7-5
				newUrl += currentUrl.substring(currentUrl.lastIndexOf('/'));
		}
		this.navigate(newUrl);
	},

	getCurrentUrl: function() {
		return _(window.location.hash.substring(1)).trim('/'); //no # and trailing slash
	}
});