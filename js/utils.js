_.mixin({
	underscored : function(string) {
		if (!_.isString(string)) return false;
		return string.toLowerCase().replace(' ', '_');
	}
});

window.leiminauts = window.leiminauts || {};