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
leiminauts.utils = {};
(function(){
	leiminauts.utils.Tooltip = {
		$body: $('body'),
		init: function() {
			if (!self.$body.find('#mouse-tooltip').length)
				self.$body.append('<div id="mouse-tooltip"></div>');
			self.$tooltip = self.$body.find('#mouse-tooltip').first();
		},
		show: function(html) {
			self.$tooltip.html(html);
			self.$tooltip.removeClass('hidden');
			self.$body.on('mousemove.tooltip', self.stickToMouse);
		},
		hide: function() {
			self.$tooltip.addClass('hidden');
			self.$body.off('mousemove.tooltip');
		},
		stickToMouse: function(e, xOffset, yOffset) {
			xOffset = xOffset || 10;
			yOffset = yOffset || 10;
			var win = $(window);
			var winWidth = win.width();
			var winHeight = win.width();
			var scrollTop = win.scrollTop();
			var scrollLeft = win.scrollLeft();
			var ttWidth = self.$tooltip.outerWidth();
			var ttHeight = self.$tooltip.outerHeight();
			var mouseX = e.pageX - scrollLeft;
			var mouseY = e.pageY - scrollTop;
			var ttLeft = mouseX;
			var ttTop = mouseY;
			if ((mouseX + ttWidth) > winWidth) {
				ttLeft = mouseX - ttWidth;
				xOffset = xOffset * -1;
			}
			if (mouseY < ttHeight) {
				ttTop = mouseY + ttHeight;
				yOffset = yOffset * -1;
			}
			console.log(mouseY, ttHeight, winHeight);
			self.$tooltip.css({ left: ttLeft + xOffset + "px", top: ttTop + yOffset + "px" });
		}
	};
	var self = leiminauts.utils.Tooltip;
	self.init();
})();

// var left = helper.parent[0].offsetLeft;
// 		var top = helper.parent[0].offsetTop;
// 		if (event) {
// 			// position the helper 15 pixel to bottom right, starting from mouse position
// 			left = event.pageX + settings(current).left;
// 			top = event.pageY + settings(current).top;
// 			var right='auto';
// 			if (settings(current).positionLeft) {
// 				right = $(window).width() - left;
// 				left = 'auto';
// 			}
// 			helper.parent.css({
// 				left: left,
// 				right: right,
// 				top: top
// 			});
// 		}
		
// 		var v = viewport(),
// 			h = helper.parent[0];
// 		// check horizontal position
// 		if (v.x + v.cx < h.offsetLeft + h.offsetWidth) {
// 			left -= h.offsetWidth + 20 + settings(current).left;
// 			helper.parent.css({left: left + 'px'}).addClass("viewport-right");
// 		}
// 		// check vertical position
// 		if (v.y + v.cy < h.offsetTop + h.offsetHeight) {
// 			top -= h.offsetHeight + 20 + settings(current).top;
// 			helper.parent.css({top: top + 'px'}).addClass("viewport-bottom");
// 		}
// 	}
	
// 	function viewport() {
// 		return {
// 			x: $(window).scrollLeft(),
// 			y: $(window).scrollTop(),
// 			cx: $(window).width(),
// 			cy: $(window).height()
// 		};
// 	}