_.mixin({
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

(function(){
	leiminauts.Tooltip = {
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
			self.$tooltip.css({ left: e.pageX + xOffset + "px", top: e.pageY + yOffset + "px" });
		}
	};
	var self = leiminauts.Tooltip;
	self.init();
})();


$WH.Tooltip = {

	create: function(htmlTooltip, secondary)
	{
		var d = $WH.ce('div'), t = $WH.ce('table'), tb = $WH.ce('tbody'), tr1 = $WH.ce('tr'), tr2 = $WH.ce('tr'), td = $WH.ce('td'), th1 = $WH.ce('th'), th2 = $WH.ce('th'), th3 = $WH.ce('th');

		d.className = 'wowhead-tooltip';

		th1.style.backgroundPosition = 'top right';
		th2.style.backgroundPosition = 'bottom left';
		th3.style.backgroundPosition = 'bottom right';

		if(htmlTooltip)
			td.innerHTML = htmlTooltip;

		$WH.ae(tr1, td);
		$WH.ae(tr1, th1);
		$WH.ae(tb, tr1);
		$WH.ae(tr2, th2);
		$WH.ae(tr2, th3);
		$WH.ae(tb, tr2);
		$WH.ae(t, tb);

		if(!secondary)
		{
			$WH.Tooltip.icon = $WH.ce('p');
			$WH.Tooltip.icon.style.visibility = 'hidden';
			$WH.ae($WH.Tooltip.icon, $WH.ce('div'));
			$WH.ae(d, $WH.Tooltip.icon);
		}

		$WH.ae(d, t);

		if(!secondary)
		{
			var img = $WH.ce('div');
			img.className = 'wowhead-tooltip-powered';
			$WH.ae(d, img);
			$WH.Tooltip.logo = img;
		}

		return d;
	},

	getMultiPartHtml: function (upper, lower)
	{
		return '<table><tr><td>' + upper + '</td></tr></table><table><tr><td>' + lower + '</td></tr></table>';
	},

	fix: function(tooltip, noShrink, visible)
	{
		var table = $WH.gE(tooltip, 'table')[0],
			td = $WH.gE(table, 'td')[0],
			c = td.childNodes;

		tooltip.className = $WH.trim(tooltip.className.replace('tooltip-slider', ''));

		if(c.length >= 2 && c[0].nodeName == 'TABLE' && c[1].nodeName == 'TABLE')
		{
			c[0].style.whiteSpace = 'nowrap';

			var m = parseInt(tooltip.style.width);
			if(!tooltip.slider || !m)
			{
				if(c[1].offsetWidth > 300)
					m = Math.max(300, c[0].offsetWidth) + 20;
				else
					m = Math.max(c[0].offsetWidth, c[1].offsetWidth) + 20;
			}

			m = Math.min(320, m);

			if(m > 20)
			{
				tooltip.style.width = m + 'px';
				c[0].style.width = c[1].style.width = '100%';

				if(tooltip.slider)
				{
					Slider.setSize(tooltip.slider, m - 6);
					tooltip.className += ' tooltip-slider';
				}

				if(!noShrink && tooltip.offsetHeight > document.body.clientHeight)
					table.className = 'shrink';
			}
		}

		if(visible)
			tooltip.style.visibility = 'visible';
	},

	fixSafe: function(p1, p2, p3)
	{
		$WH.Tooltip.fix(p1, p2, p3);
	},

	append: function(el, htmlTooltip)
	{
		var el = $WH.ge(el);
		var tooltip = $WH.Tooltip.create(htmlTooltip);
		$WH.ae(el, tooltip);

		$WH.Tooltip.fixSafe(tooltip, 1, 1);
	},

	prepare: function()
	{
		if($WH.Tooltip.tooltip)
			return;

		var _ = $WH.Tooltip.create();
		_.style.position = 'absolute';
		_.style.left = _.style.top = '-2323px';

		$WH.ae(document.body, _);

		$WH.Tooltip.tooltip      = _;
		$WH.Tooltip.tooltipTable = $WH.gE(_, 'table')[0];
		$WH.Tooltip.tooltipTd    = $WH.gE(_, 'td')[0];

		var _ = $WH.Tooltip.create(null, true);
		_.style.position = 'absolute';
		_.style.left = _.style.top = '-2323px';

		$WH.ae(document.body, _);

		$WH.Tooltip.tooltip2      = _;
		$WH.Tooltip.tooltipTable2 = $WH.gE(_, 'table')[0];
		$WH.Tooltip.tooltipTd2    = $WH.gE(_, 'td')[0];
	},

	set: function(text, text2)
	{
		var _ = $WH.Tooltip.tooltip;

		_.style.width = '550px';
		_.style.left  = '-2323px';
		_.style.top   = '-2323px';

		if(text.nodeName)
		{
			$WH.ee($WH.Tooltip.tooltipTd);
			$WH.ae($WH.Tooltip.tooltipTd, text);
		}
		else
			$WH.Tooltip.tooltipTd.innerHTML = text;

		_.style.display = '';

		$WH.Tooltip.fix(_, 0, 0);

		if(text2)
		{
			$WH.Tooltip.showSecondary = true;
			var _ = $WH.Tooltip.tooltip2;

			_.style.width = '550px';
			_.style.left  = '-2323px';
			_.style.top   = '-2323px';

			if(text2.nodeName)
			{
				$WH.ee($WH.Tooltip.tooltipTd2);
				$WH.ae($WH.Tooltip.tooltipTd2, text2);
			}
			else
				$WH.Tooltip.tooltipTd2.innerHTML = text2;

			_.style.display = '';

			$WH.Tooltip.fix(_, 0, 0);
		}
		else
			$WH.Tooltip.showSecondary = false;
	},

	moveTests: [
		[null,  null],  // Top right
		[null,  false], // Bottom right
		[false, null],  // Top left
		[false, false]  // Bottom left
	],

	move: function(x, y, width, height, paddX, paddY)
	{
		if(!$WH.Tooltip.tooltipTable) return;

		var
			tooltip = $WH.Tooltip.tooltip,
			tow     = $WH.Tooltip.tooltipTable.offsetWidth,
			toh     = $WH.Tooltip.tooltipTable.offsetHeight,
			tt2     = $WH.Tooltip.tooltip2,
			tt2w    = $WH.Tooltip.showSecondary ? $WH.Tooltip.tooltipTable2.offsetWidth : 0,
			tt2h    = $WH.Tooltip.showSecondary ? $WH.Tooltip.tooltipTable2.offsetHeight : 0,
			_;

		tooltip.style.width = tow + 'px';
		tt2.style.width = tt2w + 'px';

		var rect, safe;
		for(var i = 0, len = $WH.Tooltip.moveTests.length; i < len; ++i)
		{
			_ = $WH.Tooltip.moveTests[i];

			rect = $WH.Tooltip.moveTest(x, y, width, height, paddX, paddY, _[0], _[1]);

			if($WH.isset('Ads') && !Ads.intersect(rect))
			{
				safe = true;
				break;
			}
			else if(!$WH.isset('Ads'))
				break;
		}

		if($WH.isset('Ads') && !safe)
			Ads.intersect(rect, true);

		tooltip.style.left       = rect.l + 'px';
		tooltip.style.top        = rect.t + 'px';
		tooltip.style.visibility = 'visible';

		if($WH.Tooltip.showSecondary)
		{
			tt2.style.left = rect.l + tow + 'px';
			tt2.style.top  = rect.t + 'px';
			tt2.style.visibility = 'visible';
		}
	},

	moveTest: function(left, top, width, height, paddX, paddY, rightAligned, topAligned)
	{
		var
			bakLeft = left,
			bakTop  = top,
			tooltip = $WH.Tooltip.tooltip,
			tow     = $WH.Tooltip.tooltipTable.offsetWidth,
			toh     = $WH.Tooltip.tooltipTable.offsetHeight,
			tt2     = $WH.Tooltip.tooltip2,
			tt2w    = $WH.Tooltip.showSecondary ? $WH.Tooltip.tooltipTable2.offsetWidth : 0,
			tt2h    = $WH.Tooltip.showSecondary ? $WH.Tooltip.tooltipTable2.offsetHeight : 0,
			winSize = $WH.g_getWindowSize(),
			scroll  = $WH.g_getScroll(),
			bcw     = winSize.w,
			bch     = winSize.h,
			bsl     = scroll.x,
			bst     = scroll.y,
			minX    = bsl,
			minY    = bst,
			maxX    = bsl + bcw,
			maxY    = bst + bch;

		if(rightAligned == null)
			rightAligned = (left + width + tow + tt2w <= maxX);

		if(topAligned == null)
			topAligned = (top - Math.max(toh, tt2h) >= minY);

		if(rightAligned)
			left += width + paddX;
		else
			left = Math.max(left - (tow + tt2w), minX) - paddX;

		if(topAligned)
			top -= Math.max(toh, tt2h) + paddY;
		else
			top += height + paddY;

		if(left < minX)
			left = minX;
		else if(left + tow + tt2w > maxX)
			left = maxX - (tow + tt2w);

		if(top < minY)
			top = minY;
		else if(top + Math.max(toh, tt2h) > maxY)
			top = Math.max(bst, maxY - Math.max(toh, tt2h));

		if($WH.Tooltip.iconVisible)
		{
			if(bakLeft >= left - 48 && bakLeft <= left && bakTop >= top - 4 && bakTop <= top + 48)
				top -= 48 - (bakTop - top);
		}

		return $WH.g_createRect(left, top, tow, toh);
	},

	show: function(_this, text, paddX, paddY, spanClass, text2)
	{
		if($WH.Tooltip.disabled)
			return;

		if(!paddX || paddX < 1) paddX = 1;
		if(!paddY || paddY < 1) paddY = 1;

		if(spanClass)
			text = '<span class="' + spanClass + '">' + text + '</span>';

		var coords = $WH.ac(_this);

		$WH.Tooltip.prepare();
		$WH.Tooltip.set(text, text2);
		$WH.Tooltip.move(coords.x, coords.y, _this.offsetWidth, _this.offsetHeight, paddX, paddY);
	},

	showAtCursor: function(e, text, paddX, paddY, spanClass, text2)
	{
		if($WH.Tooltip.disabled)
			return;

		if(!paddX || paddX < 10) paddX = 10;
		if(!paddY || paddY < 10) paddY = 10;

		if(spanClass)
		{
			text = '<span class="' + spanClass + '">' + text + '</span>';
			if(text2)
				text2 = '<span class="' + spanClass + '">' + text2 + '</span>';
		}

		e = $WH.$E(e);
		var pos = $WH.g_getCursorPos(e);

		$WH.Tooltip.prepare();
		$WH.Tooltip.set(text, text2);
		$WH.Tooltip.move(pos.x, pos.y, 0, 0, paddX, paddY);
	},

	showAtXY: function(text, x, y, paddX, paddY, text2)
	{
		if($WH.Tooltip.disabled)
			return;

		$WH.Tooltip.prepare();
		$WH.Tooltip.set(text, text2);
		$WH.Tooltip.move(x, y, 0, 0, paddX, paddY);
	},

	cursorUpdate: function(e, x, y) // Used along with showAtCursor
	{
		if($WH.Tooltip.disabled || !$WH.Tooltip.tooltip)
			return;

		e = $WH.$E(e);

		if(!x || x < 10) x = 10;
		if(!y || y < 10) y = 10;

		var pos = $WH.g_getCursorPos(e);
		$WH.Tooltip.move(pos.x, pos.y, 0, 0, x, y);
	},

	hide: function()
	{
		if($WH.Tooltip.tooltip)
		{
			$WH.Tooltip.tooltip.style.display = 'none';
			$WH.Tooltip.tooltip.visibility = 'hidden';
			$WH.Tooltip.tooltipTable.className = '';

			$WH.Tooltip.setIcon(null);

			if($WH.isset('Ads'))
				Ads.restoreHidden();
		}

		if($WH.Tooltip.tooltip2)
		{
			$WH.Tooltip.tooltip2.style.display = 'none';
			$WH.Tooltip.tooltip2.visibility = 'hidden';
			$WH.Tooltip.tooltipTable2.className = '';
		}
	},

	setIcon: function(icon)
	{
		$WH.Tooltip.prepare();

		if(icon)
		{
			$WH.Tooltip.icon.style.backgroundImage = 'url(https://wowimg.zamimg.com/images/wow/icons/medium/' + icon.toLowerCase() + '.jpg)';
			$WH.Tooltip.icon.style.visibility = 'visible';
		}
		else
		{
			$WH.Tooltip.icon.style.backgroundImage = 'none';
			$WH.Tooltip.icon.style.visibility = 'hidden';
		}

		$WH.Tooltip.iconVisible = icon ? 1 : 0;
	}
};