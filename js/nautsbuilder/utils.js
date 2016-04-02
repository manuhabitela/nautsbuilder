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

	//pass "A string\n\nlike this" and get "<p>A string</p><p>like this</p>"
	paragraphed: function(string) {
		if (!_.isString(string)) return false;
		return "<p>" + string.replace(/\n\n/g, "</p><p>") + "</p>";
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
	},

	sum: function(obj, iterator, context) {
		if (!iterator && _.isEmpty(obj)) {
			return 0;
		}

		var result = 0;
		if (!iterator && _.isArray(obj)) {
			var n = obj.length;
			for (var i = 0; i < n; ++i) {
				result += obj[i];
			}
		} else {
			obj.each(function(value, index, list) {
				result += iterator ? iterator.call(context, value, index, list) : value;
			});
		}
		return result;
	},

	prod: function(obj, iterator, context) {
		if (!iterator && _.isEmpty(obj)) {
			return 1;
		}

		var result = 1;
		if (!iterator && _.isArray(obj)) {
			var n = obj.length;
			for (var i = 0; i < n; ++i) {
				result *= obj[i];
			}
		} else {
			obj.each(function(value, index, list) {
				result *= iterator ? iterator.call(context, value, index, list) : value;
			});
		}
		return result;
	},

	avg: function(obj, iterator, context) {
		return _.sum(obj, iterator, context) / _.size(obj);
	},

	transpose: function(arrayOfArrays) {
		return _.zip.apply(_, arrayOfArrays)
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

Backbone.Model.prototype.toJSON = function(options) {
	return _.extend({}, _.clone(this.attributes), { cid: this.cid });
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

	//inverse operation to treatEffects, returning an effects string
	untreatEffects: function(effects) {
		var attributes = _.map(effects, function(effect) {
			return _(effect.key).capitalized() + ": " + effect.value;
		});
		return attributes.join("; ");
	},

	removeEffect: function(effects, name) {
		var filtered = _.filter(effects, function(e) {
		    // Only keep effects that do not contain the given effect
		    return !leiminauts.utils.effectNameContains(e, name);
		});
		return filtered;
	},

	//removes any multiplier effect from an effects string
	removeMultiplierEffects: function(effectsString) {
		var effects = leiminauts.utils.treatEffects(effectsString);
		var filtered = leiminauts.utils.removeEffect(effects, "multiplier");
		return leiminauts.utils.untreatEffects(filtered);
	},

	effectNameContains: function(effect, value) {
		return effect.key.toLowerCase().indexOf(value.toLowerCase()) > -1;
	},

	number: function(number, decimals) {
		number = number*1;
		if (_(number).isNaN()) return number;
		decimals = decimals || 2;
		return number % 1 !== 0 ? number.toFixed(decimals) : number;
	},

	dps: function(damage, speed) {
		return leiminauts.utils.number( (parseFloat(speed)/60*parseFloat(damage)).toFixed(2) );
	}
};
