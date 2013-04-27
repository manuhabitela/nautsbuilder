_.mixin({
	//pass "A String like this" and get "a_string_like_this"
	underscored: function(string) {
		if (!_.isString(string)) return false;
		return string.toLowerCase().replace(' ', '_');
	},

	//pass "a_string_like_this" and get "A String like this"
	capitalized: function(string) {
		if (!_.isString(string)) return false;
		return string.replace('_', ' ').replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
	},

	//http://stackoverflow.com/questions/3000649/trim-spaces-from-start-and-end-of-string
	//https://github.com/epeli/underscore.string/blob/master/lib/underscore.string.js#L346
	trim: function(string, characters) {
		if (!string) return '';
		characters = characters || null;
		if (typeof String.prototype.trim != 'function' || characters) {
			var pattern = characters ? characters : '\\s';
			return String(string).replace(new RegExp('^' + pattern + '+|' + pattern + '+$', 'g'), '');
		} else {
			return string.trim();
		}
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

window.leiminauts = window.leiminauts || {};