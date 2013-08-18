/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.App = Backbone.Router.extend({
	routes: {
		"(console)": "charactersList",
		"favorites": "favoritesList",
		":naut(/:build)(/:order)(/console)(/forum)(/)": "buildMaker"
	},

	initialize: function(options) {
		leiminauts.ev = _({}).extend(Backbone.Events);

		leiminauts.root = window.location.host;

		if (options.data !== undefined) {
			this.data = new leiminauts.CharactersData(null, { data: options.data, console: options.console });
			this.data.on('selected', function(naut) {
				this.navigate(naut, { trigger: true });
			}, this);
		}
		this.$el = $(options.el);
		this.favorites = new leiminauts.Favorites();

		this.console = options.console;
		$('html').toggleClass('console', this.console);

		this._beforeRoute();

		this.grid = [];

		this.forum = options.forum;

		this.handleEvents();
	},

	handleEvents: function() {
		leiminauts.ev.on('toggle-favorite', function(data) {
			this.favorites.toggle(data);
		}, this);
		leiminauts.ev.on('add-favorite', function(data) {
			this.favorites.addToStorage(data);
		}, this);
		leiminauts.ev.on('update-specific-links', this.updateSpecificLinks, this);
	},

	_beforeRoute: function() {
		var url = this.getCurrentUrl();
		var oldConsole = this.console !== undefined ? this.console : undefined;
		var oldCompact = this.forum !== undefined ? this.forum : undefined;
		this.console = url.indexOf('console') !== -1;
		this.forum = url.indexOf('/forum') !== -1;
		if (oldConsole !== this.console) {
			window.location.reload();
		}
		if (oldCompact !== this.forum)
			$('html').toggleClass('forum', this.forum);
	},

	updateSpecificLinks: function() {
		var url = this.getCurrentUrl();
		$('.console-button a').attr('href', "/#" + (url.indexOf('console') !== -1 ? url.replace('console', '') : url + '/console'));

		var snippet = "[build]" + window.location.hash.substr(1) + "[/build]";
		$('.forum-snippet').val(snippet);

		$('.website-url').attr('href', window.location.href.replace('/forum', ''));
	},

	charactersList: function() {
		this._beforeRoute();
		$('html').removeClass('page-blue').addClass('page-red');

		var charsView = new leiminauts.CharactersView({
			collection: this.data,
			console: this.console
		});
		this.showView( charsView );
		this.updateSpecificLinks();
	},

	favoritesList: function() {
		this._beforeRoute();
		$('html').addClass('page-blue').removeClass('page-red');

		var favsView = new leiminauts.FavoritesView({
			collection: this.favorites,
			characters: this.data,
			console: this.console
		});
		this.showView( favsView );
		this.updateSpecificLinks();
	},

	buildMaker: function(naut, build, order) {
		if (!_.isNaN(parseInt(naut, 10)))
			return false;
		this._beforeRoute();
		if (naut == "Skolldir") naut = "Skølldir"; //to deal with encoding issues in Firefox, ø is replaced by "o" in the URL. Putting back correct name.
		naut = _.ununderscored(naut).toLowerCase();

		//check if we're just updating current build (with back button)
		if (this.currentView && this.currentView instanceof leiminauts.CharacterView &&
			this.currentView.model && this.currentView.model.get('name').toLowerCase() == naut) {
			this.updateBuildFromUrl();
			this.updateSpecificLinks();
			return true;
		}

		$('html').addClass('page-blue').removeClass('page-red');

		var character = this.data.filter(function(character) {
			var selected = character.get('name').toLowerCase() == naut;
			character.set('selected', selected);
			return selected;
		});
		if (character.length) character = character[0]; else return false;

		character.reset();
		var charView = new leiminauts.CharacterView({
			collection: this.data,
			favorites: this.favorites,
			model: character,
			console: this.console,
			forum: this.forum
		});
		this.showView( charView );

		this._initGrid();

		this.updateBuildFromUrl();
		var debouncedUrlUpdate = _.debounce(_.bind(this.updateBuildUrl, this), 500);
		this.stopListening(character.get('skills'), 'change');
		this.listenTo(character.get('skills'), 'change', debouncedUrlUpdate);
		charView.on('order:changed', debouncedUrlUpdate, this);
		charView.on('order:toggled', debouncedUrlUpdate, this);
		this.updateSpecificLinks();
	},

	showView: function(view) {
		if (this.currentView)
			this.currentView.remove();
		this.$el.html(view.render().el);
		this.currentView = view;
		return view;
	},

	updateBuildFromUrl: function() {
		if (!(this.currentView instanceof leiminauts.CharacterView))
			return false;
		charView = this.currentView;
		var character = charView.model;
		var currentUrl = this.getCurrentUrl();
		var urlParts = currentUrl.split('/');
		var build = urlParts.length > 1 ? urlParts[1] : null;
		var order = urlParts.length > 2 && !_(['forum', 'console']).contains(urlParts[2]) ? urlParts[2] : null;
		if (build === null) {
			character.reset();
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

		if (order) {
			var grid = this._initGrid();
			var orderPositions = order.split('-');
			var count = _(orderPositions).countBy(function(o) { return o; });
			var doneSteps = {};
			var items = [];
			_(orderPositions).each(function(gridPos, i) {
				var item = grid[gridPos-1];
				if (item instanceof leiminauts.Skill)
					items.push(item);
				if (item instanceof leiminauts.Upgrade) {
					if ((count[gridPos] > 1 || doneSteps[gridPos]) ) {
						doneSteps[gridPos] = doneSteps[gridPos] ? doneSteps[gridPos]+1 : 1;
						count[gridPos] = count[gridPos] - 1;
						items.push(item.get('steps').at(doneSteps[gridPos]));
					} else if (!doneSteps[gridPos])
						items.push(item.get('steps').at(1));
				}
			});
			charView.order.collection.reset(items, { sort: false });
		} else
			charView.order.toggle();
	},

	updateBuildUrl: function() {
		if (!(this.currentView instanceof leiminauts.CharacterView))
			return false;
		charView = this.currentView;
		var character = charView.model;
		var order = charView.order.active ? charView.order.collection : null;
		var buildUrl = "";
		var orderUrlParts = [];
		var orderUrl = "";
		var grid = [];
		character.get('skills').each(function(skill) {
			buildUrl += skill.get('active') ? "1" : "0";
			grid.push(skill);
			skill.get('upgrades').each(function(upgrade) {
				grid.push(upgrade);
				buildUrl += upgrade.get('current_step').get('level');
			});
		});
		if (order && order.length > 0) {
			order.each(function(item) { //item can be a skill or an upgrade step
				//get the position on the grid
				if (item instanceof leiminauts.Skill) {
					orderUrlParts.push(_(grid).indexOf(item)+1);
				} else if (item instanceof leiminauts.Step) {
					//get the upgrade tied to the step
					var upgrade = _(grid).filter(function(up) {
						return up instanceof leiminauts.Upgrade && up.get('name') == item.get('upgrade').name;
					});
					upgrade = upgrade ? upgrade[0] : false;
					if (upgrade)
						orderUrlParts.push(_(grid).indexOf(upgrade)+1);
				}
			});
			orderUrl = '/' + orderUrlParts.join('-');
		}

		var currentUrl = this.getCurrentUrl();
		var newUrl = '';
		if (currentUrl.indexOf('/') === -1) { //if url is like #leon_chameleon
			newUrl = currentUrl + '/' + buildUrl + orderUrl;
		}
		else {
			newUrl = currentUrl.substring(0, currentUrl.indexOf('/') + 1) + buildUrl + orderUrl;
			//well that's ugly
			var optionalUrlParts = ['/forum', '/console'];
			_(optionalUrlParts).each(function(part) { if (currentUrl.indexOf(part) !== -1) newUrl += part; });
		}
		this.navigate(newUrl);
		this.updateSpecificLinks();
	},

	getCurrentUrl: function() {
		//the "ø"" causes some encoding differences in Chrome and Firefox which leads Backbone to reload pages when not wanted in FF
		//I tried to work with en/decodeURIComponent and all to correct encoding problems as a whole (in case other incoming dudes have special chars in their name).
		//Without any success.
		//Sadness.
		return _(window.location.hash.substring(1)).trim('/').replace('ø', 'o'); //no # and trailing slash and no special unicode characters
	},

	_initGrid: function() {
		if (this.currentView instanceof leiminauts.CharacterView && this.grid.length > 0 && this.gridChar == this.currentView.model.get('name'))
			return this.grid;
		var grid = [];
		this.currentView.model.get('skills').each(function(skill) {
			grid.push(skill);
			skill.get('upgrades').each(function(upgrade) {
				grid.push(upgrade);
			});
		});
		this.gridChar = this.currentView.model.get('name');
		this.grid = grid;
	}
});