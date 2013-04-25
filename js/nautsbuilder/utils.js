_.mixin({
	//pass "A String like this" and get "a_string_like_this"
	underscored : function(string) {
		if (!_.isString(string)) return false;
		return string.toLowerCase().replace(' ', '_');
	}
});

//http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
Backbone.View.prototype.assign = function(view, selector) {
	view.setElement(this.$(selector)).render();
};

window.leiminauts = window.leiminauts || {};