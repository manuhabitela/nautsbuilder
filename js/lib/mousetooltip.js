//https://github.com/Leimi/mousetooltip.js
(function(){
	window.MouseTooltip = {
		init: function(opts) {
			opts = opts || {};
			opts["3d"] = opts["3d"] !== undefined ? opts["3d"] : false;
			opts["offset"] = opts["offset"] !== undefined ? opts["offset"] : { x: 10, y: 10 };
			self.opts = opts;
			$('#mouse-tooltip').remove();
			self.$tooltip = $('body').append('<div id="mouse-tooltip"></div>').find('#mouse-tooltip').first();
			self.hide();
		},
		html: function(html) {
			if (!self.$tooltip) return false;
			self.$tooltip.html(html);
		},
		show: function(html) {
			if (!self.$tooltip) return false;
			if (html !== undefined)
				self.html(html);
			self.$tooltip.removeClass('mouse-tooltip-hidden');
			$(document).on('mousemove.tooltip', self._stickToMouse);
		},
		hide: function() {
			if (!self.$tooltip) return false;
			self.$tooltip.addClass('mouse-tooltip-hidden');
			$(document).off('mousemove.tooltip');
		},
		_stickToMouse: function(e) {
			if (!self.$tooltip) return false;
			xOffset = self.opts.offset.x;
			yOffset = self.opts.offset.y;
			var win = $(window),
				ttWidth = self.$tooltip.outerWidth(),
				ttHeight = self.$tooltip.outerHeight(),
				mouseX = e.pageX,
				mouseY = e.pageY,
				ttLeft = mouseX,
				ttTop = mouseY;
			if ((mouseX + ttWidth + xOffset) > win.width()) {
				ttLeft = mouseX - ttWidth;
				xOffset = xOffset * -1;
			}
			if ((mouseY + ttHeight + yOffset) > win.height()) {
				ttTop = mouseY - ttHeight;
				yOffset = yOffset * -1;
			}
			ttLeft = ttLeft + xOffset + "px";
			ttTop = ttTop + yOffset + "px";
			var pos = {};
			if (window.Modernizr !== undefined && (Modernizr.csstransforms3d || Modernizr.csstransforms)) {
				pos[Modernizr.prefixed('transform')] = "translateX(" + ttLeft + ") translateY(" + ttTop + ")";
				pos['transform'] = "translateX(" + ttLeft + ") translateY(" + ttTop + ")";
				if (Modernizr.csstransforms3d && self.opts["3d"]) {
					pos[Modernizr.prefixed('transform')] += " translateZ(0)";
					pos['transform'] += " translateZ(0)";
				}
			} else
				pos = { left: ttLeft, top: ttTop };
			self.$tooltip.css(pos);
		}
	};
	var self = window.MouseTooltip;
})();