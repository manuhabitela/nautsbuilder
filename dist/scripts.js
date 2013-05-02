/* Nautsbuilder - Awesomenauts build calculator v0.5 - https://github.com/Leimi/awesomenauts-build-maker
* Copyright (c) 2013 Emmanuel Pelletier
* This Source Code Form is subject to the terms of the Mozilla Public License, v2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
_.mixin({
	//https://github.com/epeli/underscore.string
	//pass "a_string_like_this" and get "A String Like This"
	capitalized: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
	},
	//pass "A String like this" and get "A_String_like_this"
	underscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/[\s]+/g, '_');
	},

	//pass "A_string_Like_this" and get "A string Like this"
	ununderscored: function(string) {
		if (!_.isString(string)) return false;
		return string.replace(/_/g, ' ');
	},

	//http://stackoverflow.com/questions/3000649/trim-spaces-from-start-and-end-of-string
	trim: function(string, characters) {
		if (!string) return '';
		characters = characters || null;
		if (typeof String.prototype.trim != 'function' || characters) {
			var pattern = characters ? characters : '\\s';
			return String(string).replace(new RegExp('^' + pattern + '+|' + pattern + '+$', 'g'), '');
		} else {
			return string.trim();
		}
	},

	//kinda markdown style: pass *this* and get <em>this</em>
	italics: function(string) {
		if (!string) return '';
		return string.replace(/\n/g, "<br>").replace(/\*(.*)\*/, '<em>$1</em>');
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

window.leiminauts = window.leiminauts || {};

leiminauts.utils = {
	//takes a string like "damage: +2; crit chance: +15%" and returns an array like [{damage: "+2"}, {"crit chance": "+15%"}]
	treatEffects: function(effectsString) {
		var effects = [];
		if (!_(effectsString).isString()) return effectsString;
		var attributes = effectsString.toLowerCase().split(';');
		_(attributes).each(function(attr, i) {
			attribute = _(attr).trim().split(':');
			// [0] is the attribute (ex: "damage"), [1] is the value (ex: "+9")
			// we gently assume there is only one ":" in the string, otherwise EVERYTHING IS BORKENNNNNN
			attribute[0] = _(attribute[0]).trim();
			attribute[1] = _(attribute[1]).trim();
			if (!attribute[0] && !attribute[1]) {
				attributes.splice(i, 1);
			} else {
				effects.push({key: attribute[0], value: attribute[1]});
			}
		}, this);
		return effects;
	},

	number: function(number, decimals) {
		number = number*1;
		if (_(number).isNaN()) return number;
		decimals = decimals || 2;
		return number % 1 !== 0 ? number.toFixed(decimals) : number;
	}
};
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		this.set('totalCost', 0);
		this.set('level', 1);
		this.get('skills').on('change:totalCost', this.onCostChange, this);

		this.on('change:selected', this.onSelectedChange, this);
	},

	onCostChange: function() {
		var cost = 0;
		this.get('skills').each(function(skill) {
			cost += skill.get('totalCost');
		});
		this.set('level', Math.floor( (cost-100)/100) <= 1 ? 1 : Math.floor((cost-100)/100));
		this.set('totalCost', cost);
	},

	onSelectedChange: function() {
		this.get('skills').each(function(skill) {
			skill.set('selected', this.get('selected'));
		}, this);
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
				leiminauts.characters = this.spreadsheet.sheets('Characters').all();
				leiminauts.skills = this.spreadsheet.sheets('Skills').all();
				leiminauts.upgrades = this.spreadsheet.sheets('Upgrades').all();

				if (Modernizr.localstorage) {
					localStorage.setItem('nautsbuilder.characters', JSON.stringify(characters));
					localStorage.setItem('nautsbuilder.skills', JSON.stringify(skills));
					localStorage.setItem('nautsbuilder.upgrades', JSON.stringify(upgrades));
					localStorage.setItem('nautsbuilder.date', new Date().getTime());
				}
			} else {
				leiminauts.characters = JSON.parse(localStorage.getItem('nautsbuilder.characters'));
				leiminauts.skills = JSON.parse(localStorage.getItem('nautsbuilder.skills'));
				leiminauts.upgrades = JSON.parse(localStorage.getItem('nautsbuilder.upgrades'));
			}
			_.each(leiminauts.characters, function(character) {
				var charSkills = _(leiminauts.skills).where({ character: character.name });
				character.skills = new leiminauts.Skills(charSkills);
				this.add(character);
			}, this);
		}
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.set('upgrades', new leiminauts.Upgrades());
		this.upgrades = this.get('upgrades');
		this.upgrades.on('change', this.updateEffects, this);
		this.on('change:active', this.updateEffects, this);

		this.on('change:active', this.updateUpgradesState, this);

		this.on('change:selected', this.onSelectedChange, this);
	},

	onSelectedChange: function() {
		if (this.get('selected') && this.get('upgrades').length <= 0) {
			this._originalEffects = this.get('effects');
			this.prepareBaseEffects();
			this.initUpgrades();
			this.set('totalCost', 0);
			this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
			this.set('toggable', !this.get('active'));
		}
	},

	initUpgrades: function() {
		var skillUpgrades = [];
		//the jump skill has common upgrades, but also some custom ones sometimes
		if (this.get('type') == "jump") {
			skillUpgrades = _(leiminauts.upgrades).where({ skill: "Jump" });
			//some chars have turbo pills, others have light; we remove the one unused
			var jumpEffects = leiminauts.utils.treatEffects(this.get('effects'));
			var pills = _(jumpEffects).findWhere({key: "pills"});
			var unwantedPills = "Power Pills Light";
			if (pills && pills.value == "light") {
				unwantedPills = "Power Pills Turbo";
			}
			skillUpgrades.splice( _(skillUpgrades).indexOf( _(skillUpgrades).findWhere({ name: unwantedPills }) ), 1 );

			var effects = leiminauts.utils.treatEffects(this._originalEffects);
			effects.splice( _(effects).indexOf( _(effects).findWhere({ key: 'pills' }) ), 1 );

			//some chars have unique jump upgrades that replace common ones
			var customJumpUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(skillUpgrades).each(function(upgrade, i) {
				_(customJumpUpgrades).each(function(jupgrade) {
					if (jupgrade.replaces == upgrade.name)
						skillUpgrades[i] = _(jupgrade).clone();
				});
			});
		} else {
			skillUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
		}
		this.get('upgrades').reset(skillUpgrades);
		this.updateUpgradesState();
	},

	setActive: function(active) {
		if (this.get('toggable'))
			this.set('active', !!active);
	},

	updateUpgradesState: function(active) {
		active = active !== undefined ? active : this.get('active');
		this.upgrades.each(function(upgrade) {
			upgrade.setStep(0);
			upgrade.set('locked', !this.get('active'));
		}, this);
	},

	getActiveUpgrades: function() {
		var activeUpgrades = this.upgrades.filter(function(upgrade) {
			return upgrade.get('active') === true;
		});
		return activeUpgrades;
	},

	getActiveSteps: function() {
		var activeSteps = [];
		this.upgrades.each(function(upgrade) {
			if (upgrade.get('active') === true) {
				activeSteps.push(upgrade.get('current_step'));
			}
		});
		return activeSteps;
	},

	updateEffects: function(e) {
		if (!this.get('selected')) return false;
		if (!this.get('active')) {
			this.set('effects', []);
			this.set('totalCost', 0);
			return false;
		}
		var activeUpgrades = this.getActiveUpgrades();
		var activeSteps = this.getActiveSteps();
		this.upgrades.each(function(upgrade) {
			if (this.get('active'))
				upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		}, this);

		var cost = parseInt(this.get('cost'), 10);
		//update total skill cost
		_(activeUpgrades).each(function(upgrade) {
			cost += upgrade.get('current_step').get('level')*upgrade.get('cost');
		});
		this.set('totalCost', cost);

		//combine similar steps: some characters have upgrades that enhance similar things.
		// Ie Leon has 2 upgrades that add damages to its tong (1: +3/+6/+9 and 2: +9)
		//
		// this is KIND OF a mess
		// update 2nd of may 2013: THIS IS A BIG FREAKIN MESS. HOW DARE YOU. Sorry, future me.
		this.set('effects', [], {silent: true});
		var effects = {};
		var effectsAtEnd = [];
		var organizeEffects = function(attributesList) {
			_(attributesList).each(function(attr) {
				var val = attr.value;
				//if the effect concerns a division, it is put at the end of the array so that it divides the whole value
				if (attributesList !== effectsAtEnd && val.toString().charAt(0) == "/" && !_(parseFloat(val.substr(1))).isNaN())
					effectsAtEnd.push({key: attr.key, value: val});
				else {
					if (effects[attr.key] !== undefined)
						effects[attr.key].push(attr.value);
					else
						effects[attr.key] = [attr.value];
				}
			});
		};
		organizeEffects(this.get('baseEffects'));
		_(activeSteps).each(function(step, i) {
			organizeEffects(step.get('attrs'));
		});
		organizeEffects(effectsAtEnd);

		//for leon tong with max damage, our effects var now looks like: { "damage": ["+9", "+9"], "range": ["+2.4"], ...  }
		//we must combine effects values that looks like numbers so we have "damage": "+18",
		//without forgetting the possible "+", "-", "%", "/", "s"
		var effectRegex = /^(\+|-|\/)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		_(effects).each(function(values, key) {
			var effect = "";
			var oldEffect = false;
			_(values).each(function(value, i) {
				regexRes = effectRegex.exec(value);
				if (regexRes !== null) {
					var showUnit = true;
					var effectNumber = parseFloat(effect);
					if (_(effectNumber).isNaN()) effectNumber = 0;

					//if original value is %, we just += values. Otherwise (ie attack speed), we calculate the % based on original value
					if (regexRes[3] && regexRes[3] == "%" && effectNumber !== 0 && values[0].substr(-1) != "%") {
						effectNumber += parseFloat(values[0]) * (parseFloat(value)/100);
						showUnit = false;
					}
					//we divide if there is a "/"
					else if (regexRes[1] && regexRes[1] == "/") {
						effectNumber = effectNumber/parseFloat(value.substr(1));
					}
					else
						effectNumber += parseFloat(value, 10);
					effectNumber = leiminauts.utils.number(effectNumber);
					effect = effectNumber;
					if (regexRes[3] && showUnit) effect += regexRes[3];
					if (regexRes[1] && regexRes[1] == "+" && effectNumber > 0 && (!oldEffect || oldEffect.toString().indexOf('+') === 0))
						effect = "+" + effect;
				} else
					effect = value;
				oldEffect = effect;
			});
			this.get('effects').push({ "key": key, value: effect });
		}, this);
		this.setSpecificEffects();
		this.setDPS();
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key.toLowerCase(); }));
	},

	prepareBaseEffects: function() {
		if (!this.get('selected')) return false;
		if (!_(this.get('effects')).isString())
			return false;
		this.set('baseEffects', leiminauts.utils.treatEffects(this.get('effects')));
		if (this.get('type') == "jump") {
			var effects = _(this.get('baseEffects'));
			effects.splice( _(effects).indexOf( _(effects).findWhere({ key: 'pills' }) ), 1 );
			var solar = effects.findWhere({key: "solar"});
			var solarPerMin = effects.findWhere({key: "solar per min"});
			if (!solar)
				effects.push({key: "solar", value: 200});
			if (!solarPerMin)
				effects.push({key: "solar per min", value: 30});
		}
	},

	setSpecificEffects: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		var avgDmg = 0;

		if (this.get('name') == "Missiles") {
			var missilesSequence = [];
			var baseDamage = effects.findWhere({key: "damage"}).value;
			_(4).times(function() { missilesSequence.push(baseDamage); });
			var missiles = effects.filter(function(effect) {
				return (/^missile [0-9]$/).test(effect.key);
			});
			_(missiles).each(function(missile) {
				var number = parseInt(missile.key.substr(-1), 10)-1;
				missilesSequence[number] = (baseDamage + (4*number))*parseInt(missile.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: missile.key }) ), 1 );
			});
			while ((missilesSequence.length > 1) && (missilesSequence[missilesSequence.length-1] == baseDamage))
				missilesSequence.pop();
			avgDmg = _(missilesSequence).reduce(function(memo, num){ return memo + num; }, 0) / missilesSequence.length;
			effects.findWhere({key: "damage"}).value = missilesSequence.join(' > ');
			effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}

		if (this.get('name') == "Bash") {
			var punchsSequence = _(this.get('baseEffects')).findWhere({key:"damage"}).value.split(' > ');
			var punchs = effects.filter(function(effect) {
				return (/^punch [0-9]$/).test(effect.key);
			});
			_(punchs).each(function(punch) {
				var number = parseInt(punch.key.substr(-1), 10)-1;
				punchsSequence[number] = punchsSequence[number]*1 + parseInt(punch.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: punch.key }) ), 1 );
			});

			avgDmg = _(punchsSequence).reduce(function(memo, num){ return memo + num*1; }, 0) / punchsSequence.length;
			effects.findWhere({key: "damage"}).value = punchsSequence.join(' > ');
			effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}
	},

	setDPS: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		var attackSpeed = effects.findWhere({key: "attack speed"});
		var damage = effects.findWhere({key: "avg damage"});
		if (!damage) damage = effects.findWhere({key: "damage"});
		var dps = effects.findWhere({key: "dps"});
		if (attackSpeed && damage) {
			var dpsVal = (parseFloat(attackSpeed.value, 10)/60*parseFloat(damage.value, 10)).toFixed(2);
			dpsVal = leiminauts.utils.number(dpsVal);
			if (dps) dps.value = dpsVal;
			else effects.push({key: "DPS", value: dpsVal});
		}
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Upgrade = Backbone.Model.extend({
	defaults: {
		current_step: null,
		max_step: 0,
		active: false,
		locked: false
	},

	initialize: function(attrs, opts) {
		var steps = _(this.attributes).filter(function(attr, key) {
			return (/^step[0-9]$/).test(key) && attr !== "";
		});
		var stepsCollection = new leiminauts.Steps([ new leiminauts.Step() ]);
		_(steps).each(function(step, i)  {
			stepsCollection.add({ level: i+1, description: step });
		});
		this.set('steps', stepsCollection);
		this.set('max_step', stepsCollection.size()-1);

		this.set('description', _(this.get('description').replace(/\n/g, "<br>")).italics());

		this.setStep(0);
	},

	setStep: function(number) {
		number = parseInt(number, 10);
		var currentStep = this.get('steps').findWhere({level: number});
		this.set('current_step', currentStep);
		this.set('active', currentStep.get('level') > 0);
	}
});

leiminauts.Upgrades = Backbone.Collection.extend({
	model: leiminauts.Upgrade
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Step = Backbone.Model.extend({
	defaults: {
		level: 0,
		description: ''
	},

	initialize: function() {
		this.set('attrs', leiminauts.utils.treatEffects(this.get('description')));
		//description is a string showing the list of effects the step gives. Ex: "crit chance: +15%; crit damage: +10"
		//so each attribute is separated by a ";"
		//and attribute name and value are separated by a ":"
	}
});

leiminauts.Steps = Backbone.Collection.extend({
	model: leiminauts.Step
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharactersView = Backbone.View.extend({
	className: 'chars-list-container',

	events: {
		"click .char": "selectCharacter"
	},

	initialize: function() {
		this.template = _.template( $('#chars-tpl').html() );
		this.collection.on('add remove reset', this.render, this);

		if (this.options.character !== undefined)
			this.character = this.options.character.model.toJSON();

		this.currentChar = null;

		this.mouseOverTimeout = null;

		this.$el.on('mouseover', '.char', _.bind(_.debounce(this.showCharInfo, 50), this));
	},

	render: function() {
		this.$el.html(this.template({ "characters": this.collection.toJSON(), "currentChar": this.currentChar, character: this.character }));
		return this;
	},

	selectCharacter: function(e) {
		this.collection.trigger('selected', $(e.currentTarget).attr('data-id'));
	},

	showCharInfo: function(e) {
		if (this.character) return false;
		var character = $(e.currentTarget).attr('data-id');
		if (this.currentChar === null || this.currentChar.get('name') !== _.ununderscored(character)) {
			this.currentChar = this.collection.findWhere({name: _.ununderscored(character)});
			this.render();
		}
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.CharacterView = Backbone.View.extend({
	tagName: 'div',

	className: 'char-builder',

	events: {
	},

	initialize: function(opts) {
		_.defaults(opts, { build: null, order: null, info: null });

		this.model.set('selected', true);

		this.template = _.template( $('#char-tpl').html() );

		this.characters = new leiminauts.CharactersView({ character: this, state: opts.build, collection: this.collection });
		this.build = new leiminauts.BuildView({ character: this, state: opts.build });
		this.info = new leiminauts.InfoView({ character: this, state: opts.info });
		this.order = new leiminauts.OrderView({ character: this, state: opts.order });

		this.render();
	},

	render: function() {
		$('body').attr('data-page', 'char');
		this.$el.html(this.template( this.model.toJSON() ));
		this.assign(this.characters, '.chars');
		this.assign(this.build, '.build');
		this.assign(this.info, '.char-info');
		this.assign(this.order, '.order');
		return this;
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.BuildView = Backbone.View.extend({
	tagName: 'div',

	className: 'build',

	events: {
		"click .build-cancel": "reset"
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}

		this.skills = [];
		this.model.get('skills').each(function(skill) {
			this.skills.push(new leiminauts.SkillView({ model: skill }));
		}, this);

		this.template = _.template( $('#build-tpl').html() );

		//not that good to put this here but YOLO
		this.model.get('skills').on('change:active', this.toggleResetButtonClass, this);
		this.model.get('skills').each(_.bind(function(skill) { skill.get('upgrades').on('change:active', this.toggleResetButtonClass, this); }, this));
		this.toggleResetButtonClass();
	},

	//not that good to put this here but YOLO
	toggleResetButtonClass: function() {
		if (!this.$resetButton) return false;

		var active = false;
		this.model.get('skills').each(function(skill) {
			if ( (skill.get('active') && skill.get('toggable')) || skill.getActiveUpgrades().length > 0) {
				active = true;
				return false;
			}
		});
		this.$resetButton.toggleClass('active', active);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		this.$resetButton = this.$('.build-cancel');
		_(this.skills).each(function(skill) {
			skill.delegateEvents();
			this.$el.append(skill.render().el);
		}, this);
		return this;
	},

	reset: function() {
		this.model.get('skills').each(function(skill) {
			skill.setActive(false);
			if (!skill.get('toggable'))
				skill.updateUpgradesState(false);
		});
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.OrderView = Backbone.View.extend({
	tagName: 'div',

	className: 'order',

	events: {
	},

	initialize: function() {
		if (this.options.character) {
			this.character = this.options.character;
			this.model = this.character.model;
		}
		this.template = _.template( $('#order-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.SkillView = Backbone.View.extend({
	tagName: 'div',

	className: 'skill-wrapper',

	events: {
		'mouseover .skill-icon': 'handleTooltip',
		'mouseout .skill-icon': 'handleTooltip',
		'click .skill-icon': 'toggleState',
		'click .skill-cancel': 'reset'
	},

	initialize: function() {
		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );

		this.model.get('upgrades').on('change', this.renderUpgradesInfo, this);

		this.model.on('change', this.render, this);
	},

	toggleState: function() {
		this.model.setActive(!this.model.get('active'));
	},

	reset: function() {
		this.model.setActive(false);
		if (!this.model.get('toggable'))
			this.model.updateUpgradesState(false);
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		_(this.upgrades).each(function(upgrade) {
			upgrade.delegateEvents();
			this.$('.skill-upgrades').append(upgrade.render().el);
		}, this);

		this.renderUpgradesInfo();
		return this;
	},

	renderUpgradesInfo: function() {
		this.$(".skill-effects").html(
			_.template(
				$('#build-skill-effects-tpl').html(),
				this.model.toJSON()
			)
		);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.skill-popup').html());
		else
			MouseTooltip.hide();
	}
});
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.UpgradeView = Backbone.View.extend({
	tagName: 'div',

	className: 'upgrade',

	events: {
		'mouseover': 'handleTooltip',
		'mouseout': 'handleTooltip',
		'click': 'onClick'
	},

	initialize: function() {
		this.template = _.template( $('#build-upgrade-tpl').html() );


		this.model.on('change', this.render, this);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		_(['active', 'locked']).each(function(prop) {
			this.$el.toggleClass(prop, this.model.get(prop));
		}, this);
		return this;
	},

	onClick: function(e) {
		this.updateStep();
		//update the tooltip immediatly so the user don't have to move its mouse to see the current step's description
		this.handleTooltip(e);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.upgrade-popup').html());
		else
			MouseTooltip.hide();
	},

	updateStep: function() {
		if (this.model.get('locked'))
			return false;
		var currentStep = this.model.get('current_step') ? this.model.get('current_step').get('level') : 0;
		if (currentStep >= this.model.get('max_step'))
			this.model.setStep(0);
		else
			this.model.setStep(currentStep +1);
	}
});
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
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
;(function() {
	MouseTooltip.init({ "3d": true });

	//small "hack" to set the page to red background directly if we're on root
	$('body').toggleClass('page-red', !window.location.hash.length);

	leiminauts.init = function(opts) {
		opts = opts || {};
		_.defaults(opts, { el: "#container", spreadsheet: false });
		window.nautsbuilder = new leiminauts.App(opts);
		Backbone.history.start({pushState: false, root: "/nautsbuilder/"});
	};

	leiminauts.lastDataUpdate = new Date("April 30, 2013 09:00:00 GMT+0200");
	leiminauts.localDate = Modernizr.localstorage && localStorage.getItem('nautsbuilder.date') || 0;
	leiminauts.localDate = 0; //while dev

	if (leiminauts.lastDataUpdate.getTime() > leiminauts.localDate) {
		//dev 0AuPP-DBESPOedHpYZUNPa1BSaEFVVnRoa1dTNkhCMEE
		//prod 0AuPP-DBESPOedDl3UmM1bHpYdDNXaVRyTTVTQlZQWVE
		//opened 0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc
		Tabletop.init({
			key: "0AuPP-DBESPOedF9hckdzMWVhc2c3Rkk1R2RTa1pUdWc",
			wait: false,
			debug: false,
			callback: function(data, tabletop) {
				leiminauts.init({ spreadsheet: tabletop });
			}
		});
	} else {
		leiminauts.init({});
	}
}());