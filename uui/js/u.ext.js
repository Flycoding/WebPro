//+function( factory ) {
//	if ( typeof define === "function" && define.amd ) {
//
//		// AMD. Register as an anonymous module.
//		define([
//			"jquery"
//		], factory );
//	} else {
//
//		// Browser globals
//		factory( jQuery );
//	}
//}(
+ function($) {
	'use strict';

	//jQuery.autocomplete = function(input, options) {
	//
	//}




	var Autocomplete = function(element, options) {
		this.$input = $(element)
		this.options = $.extend({}, Autocomplete.DEFAULTS, options)
		this.requestIndex = 0
		this.pending = 0
		// Create a link to self
		var me = this;

		// Create jQuery object for input element
		//	var $input = $(input).attr("autocomplete", "off");

		// Apply inputClass if necessary
		if (this.options.inputClass) this.$input.addClass(this.options.inputClass);

		// Create results
		var results = document.createElement("div");
		// Create jQuery object for results
		this.$results = $(results);
		this.$results.hide().addClass(this.options.resultsClass).css("position", "absolute");
		if (this.options.width > 0) $results.css("width", this.options.width);

		// Add to body element
		$("body").append(results);

		//	input.autocompleter = me;

		this.timeout = null;
		this.prev = "";
		this.active = -1;
		this.cache = {};
		this.keyb = false;
		this.hasFocus = false;
		this.lastKeyPressCode = null;

		// flush cache
//		this.flushCache();
		this._initSource();

//		// if there is a data array supplied
//		if (this.options.data != null) {
//			var sFirstChar = "",
//				stMatchSets = {},
//				row = [];
//
//			// no url was specified, we need to adjust the cache length to make sure it fits the local data store
//			if (typeof this.options.url != "string") this.options.cacheLength = 1;
//
//			// loop through the array and create a lookup structure
//			for (var i = 0; i < this.options.data.length; i++) {
//				// if row is a string, make an array otherwise just reference the array
//				row = ((typeof this.options.data[i] == "string") ? [this.options.data[i]] : this.options.data[i]);
//
//				// if the length is zero, don't add to list
//				if (row[0].length > 0) {
//					// get the first character
//					sFirstChar = row[0].substring(0, 1).toLowerCase();
//					// if no lookup array for this character exists, look it up now
//					if (!stMatchSets[sFirstChar]) stMatchSets[sFirstChar] = [];
//					// if the match is a string
//					stMatchSets[sFirstChar].push(row);
//				}
//			}
//
//			// add the data items to the cache
//			for (var k in stMatchSets) {
//				// increase the cache size
//				this.options.cacheLength++;
//				// add to the cache
//				this.addToCache(k, stMatchSets[k]);
//			}
//		}

		this.$input.keydown(function(e) {
				// track last key pressed
				me.lastKeyPressCode = e.keyCode;
				switch (e.keyCode) {
					case 38: // up
						e.preventDefault();
						me.moveSelect(-1);
						break;
					case 40: // down
						e.preventDefault();
						me.moveSelect(1);
						break;
					case 9: // tab
					case 13: // return
						if (me.selectCurrent()) {
							// make sure to blur off the current field
							me.$input.get(0).blur();
							e.preventDefault();
						}
						break;
					default:
						me.active = -1;
						if (me.timeout) clearTimeout(me.timeout);
						me.timeout = setTimeout(function() {
							me.onChange();
						}, me.options.delay);
						break;
				}
			})
			.focus(function() {
				// track whether the field has focus, we shouldn't process any results if the field no longer has focus
				me.hasFocus = true;
			})
			.blur(function() {
				// track whether the field has focus
				me.hasFocus = false;
				me.hideResults();
			});

		this.hideResultsNow();


		//  this.update(this.options)
	}

	Autocomplete.DEFAULTS = {
		inputClass: "ac_input",
		resultsClass: "ac_results",
		lineSeparator: "\n",
		cellSeparator: "|",
		minChars: 1,
		delay: 400,
		matchCase: 0,
		matchSubset: 1,
		matchContains: 0,
		cacheLength: 1,
		mustMatch: 0,
		extraParams: {},
		loadingClass: "ac_loading",
		selectFirst: false,
		selectOnly: false,
		maxItemsToShow: -1,
		autoFill: false,
		width: 0,
		source:null,
		select: null
	}

	Autocomplete.fn = Autocomplete.prototype;

	// flush cache
	Autocomplete.fn.flushCache = function() {
		this.cache = {};
		this.cache.data = {};
		this.cache.length = 0;
	};

	Autocomplete.fn._initSource = function() {
		var array, url, me = this;
		if ( $.isArray( this.options.source ) ) {
			array = this.options.source;
			this.source = function( request, response ) {
//				response( $.ui.autocomplete.filter( array, request.term ) );
				response(me.filterData(request.term, array));
			};
		} else if ( typeof this.options.source === "string" ) {
			url = this.options.source;
			this.source = function( request, response ) {
				if ( me.xhr ) {
					me.xhr.abort();
				}
				me.xhr = $.ajax({
					url: url,
					data: request,
					dataType: "json",
					success: function( data ) {
						response( data );
					},
					error: function() {
						response([]);
					}
				});
			};
		} else {
			this.source = this.options.source;
		}
	}
	
	Autocomplete.fn._response = function() {
		var index = ++this.requestIndex;

		return $.proxy(function( content ) {
			if ( index === this.requestIndex ) {
				this.__response( content );
			}

			this.pending--;
			if ( !this.pending ) {
//				this.element.removeClass( "ui-autocomplete-loading" );
			}
		}, this );
	}

	Autocomplete.fn.__response = function( content ) {
		if ( content ) 
//			content = this._normalize( content );
//		}
//		this._trigger( "response", null, { content: content } );
//		if ( !this.options.disabled && content && content.length && !this.cancelSearch ) {
//			this._suggest( content );
//			this._trigger( "open" );
			this.receiveData2(content);
			this.showResults();
//		} else {
//			// use ._close() instead of .close() so we don't cancel future searches
//			this._close();
//		}
	}
	



	Autocomplete.fn.onChange = function() {
		// ignore if the following keys are pressed: [del] [shift] [capslock]
		if (this.lastKeyPressCode == 46 || (this.lastKeyPressCode > 8 && this.lastKeyPressCode < 32)) return this.$results.hide();
		var v = this.$input.val();
		if (v == this.prev) return;
		this.prev = v;
		if (v.length >= this.options.minChars) {
			this.$input.addClass(this.options.loadingClass);
//			this.requestData(v);
			this.pending++;
			this.source( { term: v }, this._response() );
		} else {
			this.$input.removeClass(this.options.loadingClass);
			this.$results.hide();
		}
	};

	Autocomplete.fn.moveSelect = function(step) {
		var lis = $("li", this.$results[0]);
		if (!lis) return;

		this.active += step;

		if (this.active < 0) {
			this.active = 0;
		} else if (this.active >= lis.size()) {
			this.active = lis.size() - 1;
		}

		lis.removeClass("ac_over");

		$(lis[this.active]).addClass("ac_over");
	};

	Autocomplete.fn.selectCurrent = function() {
		var li = $("li.ac_over", this.$results[0])[0];
		if (!li) {
			var $li = $("li", this.$results[0]);
			if (this.options.selectOnly) {
				if ($li.length == 1) li = $li[0];
			} else if (this.options.selectFirst) {
				li = $li[0];
			}
		}
		if (li) {
			this.selectItem(li);
			return true;
		} else {
			return false;
		}
	};

	Autocomplete.fn.selectItem = function(li) {
		var me = this;
		if (!li) {
			li = document.createElement("li");
//			li.extra = [];
			li.selectValue = "";
		}
		var v = $.trim(li.selectValue ? li.selectValue : li.innerHTML);
		this.lastSelected = v;
		this.prev = v;
		this.$results.html("");
		this.$input.val(v);
		this.hideResultsNow();
		if (this.options.select) setTimeout(function() {
			me.options.select(li._item)
		}, 1);
	};

	// selects a portion of the input string
	Autocomplete.fn.createSelection = function(start, end) {
		// get a reference to the input element
		var field = this.$input.get(0);
		if (field.createTextRange) {
			var selRange = field.createTextRange();
			selRange.collapse(true);
			selRange.moveStart("character", start);
			selRange.moveEnd("character", end);
			selRange.select();
		} else if (field.setSelectionRange) {
			field.setSelectionRange(start, end);
		} else {
			if (field.selectionStart) {
				field.selectionStart = start;
				field.selectionEnd = end;
			}
		}
		field.focus();
	};

	// fills in the input box w/the first match (assumed to be the best match)
	Autocomplete.fn.autoFill = function(sValue) {
		// if the last user key pressed was backspace, don't autofill
		if (this.lastKeyPressCode != 8) {
			// fill in the value (keep the case the user has typed)
			this.$input.val(this.$input.val() + sValue.substring(this.prev.length));
			// select the portion of the value not typed by the user (so the next character will erase)
			this.createSelection(this.prev.length, sValue.length);
		}
	};

	Autocomplete.fn.showResults = function() {
		// get the position of the input field right now (in case the DOM is shifted)
		var pos = findPos(this.$input[0]);
		// either use the specified width, or autocalculate based on form element
		var iWidth = (this.options.width > 0) ? this.options.width : this.$input.width();
		// reposition
		this.$results.css({
			width: parseInt(iWidth) + "px",
			top: (pos.y + this.$input[0].offsetHeight) + "px",
			left: pos.x + "px"
		}).show();
	};

	Autocomplete.fn.hideResults = function() {
		var me = this;
		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(function() {
			me.hideResultsNow();
		}, 200);
	};

	Autocomplete.fn.hideResultsNow = function() {
		if (this.timeout) clearTimeout(this.timeout);
		this.$input.removeClass(this.options.loadingClass);
		if (this.$results.is(":visible")) {
			this.$results.hide();
		}
		if (this.options.mustMatch) {
			var v = this.$input.val();
			if (v != this.lastSelected) {
				this.selectItem(null);
			}
		}
	};

	Autocomplete.fn.receiveData = function(q, data) {
		if (data) {
			this.$input.removeClass(this.options.loadingClass);
			this.$results.html('');

			// if the field no longer has focus or if there are no matches, do not display the drop down
			if (!this.hasFocus || data.length == 0) return this.hideResultsNow();

			//			if ($.u.IS_IE) {
			// we put a styled iframe behind the calendar so HTML SELECT elements don't show through
			//				this.$results.append(document.createElement('iframe'));
			//			}
			this.$results.append(this.dataToDom(data));
			// autofill in the complete box w/the first match as long as the user hasn't entered in more data
			if (this.options.autoFill && (this.$input.val().toLowerCase() == q.toLowerCase())) this.autoFill(data[0][0]);
			this.showResults();
		} else {
			this.hideResultsNow();
		}
	};
	
	Autocomplete.fn.filterData = function(v, items) {
		if (!v) return items;
		var _items = [];
		for (var i =0, count = items.length; i< count; i++){
			var label = items[i].label;
			if (label.indexOf(v) == 0)
				_items.push(items[i]);
		}
		return _items;
	};
	
	
	Autocomplete.fn.receiveData2 = function(items) {
		if (items) {
			this.$input.removeClass(this.options.loadingClass);
			this.$results.html('');

			// if the field no longer has focus or if there are no matches, do not display the drop down
			if (!this.hasFocus || items.length == 0) return this.hideResultsNow();

			//			if ($.u.IS_IE) {
			// we put a styled iframe behind the calendar so HTML SELECT elements don't show through
			//				this.$results.append(document.createElement('iframe'));
			//			}
			this.$results.append(this.dataToDom2(items));
			// autofill in the complete box w/the first match as long as the user hasn't entered in more data
//			if (this.options.autoFill && (this.$input.val().toLowerCase() == q.toLowerCase())) this.autoFill(data[0][0]);
			this.showResults();
		} else {
			this.hideResultsNow();
		}		
	}
	Autocomplete.fn.dataToDom2 = function(items) {
		var ul = document.createElement("ul");
		var num = items.length;
		var me = this;

		// limited results to a max number
		if ((this.options.maxItemsToShow > 0) && (this.options.maxItemsToShow < num)) num = this.options.maxItemsToShow;

		for (var i = 0; i < num; i++) {
			var item = items[i];
			if (!item) continue;
			var li = document.createElement("li");
			if (this.options.formatItem) 
				li.innerHTML = this.options.formatItem(item, i, num);
			else 
				li.innerHTML = item.label;
			li.selectValue = item.label;
			li._item = item;
			ul.appendChild(li);
			$(li).hover(
				function() {
					$("li", ul).removeClass("ac_over");
					$(this).addClass("ac_over");
					me.active = indexOf($("li", ul), $(this).get(0));
				},
				function() {
					$(this).removeClass("ac_over");
				}
			).click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				me.selectItem(this)
			});
		}
		return ul;
	};	

	Autocomplete.fn.parseData = function(data) {
		if (!data) return null;
		var parsed = [];
		var rows = data.split(this.options.lineSeparator);
		for (var i = 0; i < rows.length; i++) {
			var row = $.trim(rows[i]);
			if (row) {
				parsed[parsed.length] = row.split(this.options.cellSeparator);
			}
		}
		return parsed;
	};

	Autocomplete.fn.dataToDom = function(data) {
		var ul = document.createElement("ul");
		var num = data.length;
		var me = this;

		// limited results to a max number
		if ((this.options.maxItemsToShow > 0) && (this.options.maxItemsToShow < num)) num = this.options.maxItemsToShow;

		for (var i = 0; i < num; i++) {
			var row = data[i];
			if (!row) continue;
			var li = document.createElement("li");
			if (this.options.formatItem) {
				li.innerHTML = this.options.formatItem(row, i, num);
				li.selectValue = row[0];
			} else {
				li.innerHTML = row[0];
				li.selectValue = row[0];
			}
			var extra = null;
			if (row.length > 1) {
				extra = [];
				for (var j = 1; j < row.length; j++) {
					extra[extra.length] = row[j];
				}
			}
			li.extra = extra;
			ul.appendChild(li);
			$(li).hover(
				function() {
					$("li", ul).removeClass("ac_over");
					$(this).addClass("ac_over");
					me.active = indexOf($("li", ul), $(this).get(0));
				},
				function() {
					$(this).removeClass("ac_over");
				}
			).click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				me.selectItem(this)
			});
		}
		return ul;
	};

	Autocomplete.fn.requestData = function(q) {
		var me = this;
		if (!this.options.matchCase) q = q.toLowerCase();
		var data = this.options.cacheLength ? this.loadFromCache(q) : null;
		// recieve the cached data
		if (data) {
			this.receiveData(q, data);
			// if an AJAX url has been supplied, try loading the data now
		} else if ((typeof this.options.url == "string") && (this.options.url.length > 0)) {
			$.get(this.makeUrl(q), function(data) {
				data = me.parseData(data);
				me.addToCache(q, data);
				me.receiveData(q, data);
			});
			// if there's been no data found, remove the loading class
		} else {
			this.$input.removeClass(this.options.loadingClass);
		}
	};

	Autocomplete.fn.makeUrl = function(q) {
		var url = this.options.url + "?q=" + encodeURI(q);
		for (var i in this.options.extraParams) {
			url += "&" + i + "=" + encodeURI(this.options.extraParams[i]);
		}
		return url;
	};

	Autocomplete.fn.loadFromCache = function(q) {
		if (!q) return null;
		if (this.cache.data[q]) return this.cache.data[q];
		if (this.options.matchSubset) {
			for (var i = q.length - 1; i >= this.options.minChars; i--) {
				var qs = q.substr(0, i);
				var c = this.cache.data[qs];
				if (c) {
					var csub = [];
					for (var j = 0; j < c.length; j++) {
						var x = c[j];
						var x0 = x[0];
						if (this.matchSubset(x0, q)) {
							csub[csub.length] = x;
						}
					}
					return csub;
				}
			}
		}
		return null;
	};

	Autocomplete.fn.matchSubset = function(s, sub) {
		if (!this.options.matchCase) s = s.toLowerCase();
		var i = s.indexOf(sub);
		if (i == -1) return false;
		return i == 0 || this.options.matchContains;
	};

	Autocomplete.fn.addToCache = function(q, data) {
		if (!data || !q || !this.options.cacheLength) return;
		if (!this.cache.length || this.cache.length > this.options.cacheLength) {
			this.flushCache();
			this.cache.length++;
		} else if (!this.cache[q]) {
			this.cache.length++;
		}
		this.cache.data[q] = data;
	};

	function findPos(obj) {
		var curleft = obj.offsetLeft || 0;
		var curtop = obj.offsetTop || 0;
		while (obj = obj.offsetParent) {
			curleft += obj.offsetLeft
			curtop += obj.offsetTop
		}
		return {
			x: curleft,
			y: curtop
		};
	}

	function indexOf($element, e) {
		for (var i = 0; i < $element.length; i++) {
			if ($element[i] == e) return i;
		}
		return -1;
	};



	function Plugin(option) {
		if (this.length != 1) return;
		var $this = $(this)
		var data = $this.data('u.autocomplete')
		var options = typeof option == 'object' && option

		if (!data) $this.data('u.autocomplete', (data = new Autocomplete(this, options)))
			//	else data.update(options);
		return data;
	}

	var old = $.fn.autocomplete

	$.fn.autocomplete = Plugin
	$.fn.autocomplete.Constructor = Autocomplete



	$.fn.autocomplete.noConflict = function() {
		$.fn.autocomplete = old
		return this
	}


}(jQuery);
/* ========================================================================
 * UUI: backtop.js v0.0.1
 *
 * ========================================================================
 * Copyright 2014 yonyou, Inc.
 * Licensed under MIT ()
 * ======================================================================== */


+ function($) {
	'use strict';

	var BackTop = function(element, options) {
		var me = this;
		this.$element = $(element)
		this.options = $.extend({}, BackTop.DEFAULTS, options);

		$(window).scroll(function(e) {
			if($(document).scrollTop() > me.options.toggleHeight) {
				me.$element.addClass("active");
			} else {
				me.$element.removeClass("active");
			}
		});
		this.$element.click(function() {
			$(document).scrollTop(0);
		});
		

	}

	BackTop.DEFAULTS = {
		toggleHeight : 100

	}

	BackTop.fn = BackTop.prototype

	function Plugin(option) {
		if (this.length != 1) return;
		var $this = $(this)
		var data = $this.data('u.backtop')
		var options = typeof option == 'object' && option

		if (!data) $this.data('u.backtop', (data = new BackTop(this, options)))
		return data;
	}

	var old = $.fn.backtop

	$.fn.backtop = Plugin
	$.fn.backtop.Constructor = BackTop



	$.fn.backtop.noConflict = function() {
		$.fn.backtop = old
		return this
	}


}(jQuery);
/* =========================================================
 * bootstrap-datetimepicker.js
 * =========================================================
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 * Improvements by Sébastien Malot
 * Improvements by Yun Lai
 * Improvements by Kenneth Henderick
 * Project URL : http://www.malot.fr/bootstrap-datetimepicker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

/*
 * Improvement by CuGBabyBeaR @ 2013-09-12
 *
 * Make it work in bootstrap v3
 */

!function ($) {

	function UTCDate() {
		return new Date(Date.UTC.apply(Date, arguments));
	}

	function UTCToday() {
		var today = new Date();
		return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds(), 0);
	}

	// Picker object

	var Datetimepicker = function (element, options) {
		var that = this;

		this.element = $(element);

		// add container for single page application
		// when page switch the datetimepicker div will be removed also.
		this.container = options.container || 'body';

		this.language = options.language || this.element.data('date-language') || "en";
		this.language = this.language in dates ? this.language : "en";
		this.isRTL = dates[this.language].rtl || false;
		this.formatType = options.formatType || this.element.data('format-type') || 'standard';
		this.format = DPGlobal.parseFormat(options.format || this.element.data('date-format') || dates[this.language].format || DPGlobal.getDefaultFormat(this.formatType, 'input'), this.formatType);
		this.isInline = false;
		this.isVisible = false;
		this.isInput = this.element.is('input');
		this.fontAwesome = options.fontAwesome || this.element.data('font-awesome') || false;

		this.bootcssVer = options.bootcssVer || (this.isInput ? (this.element.is('.form-control') ? 3 : 2) : ( this.bootcssVer = this.element.is('.input-group') ? 3 : 2 ));

		this.component = this.element.is('.date') ? ( this.bootcssVer == 3 ? this.element.find('.input-group-addon .glyphicon-th, .input-group-addon .glyphicon-time, .input-group-addon .glyphicon-calendar, .input-group-addon .glyphicon-calendar, .input-group-addon .fa-calendar, .input-group-addon .fa-clock-o').parent() : this.element.find('.add-on .icon-th, .add-on .icon-time, .add-on .icon-calendar .fa-calendar .fa-clock-o').parent()) : false;
		this.componentReset = this.element.is('.date') ? ( this.bootcssVer == 3 ? this.element.find('.input-group-addon .glyphicon-remove .fa-times').parent() : this.element.find('.add-on .icon-remove .fa-times').parent()) : false;
		this.hasInput = this.component && this.element.find('input').length;
		if (this.component && this.component.length === 0) {
			this.component = false;
		}
		this.linkField = options.linkField || this.element.data('link-field') || false;
		this.linkFormat = DPGlobal.parseFormat(options.linkFormat || this.element.data('link-format') || DPGlobal.getDefaultFormat(this.formatType, 'link'), this.formatType);
		this.minuteStep = options.minuteStep || this.element.data('minute-step') || 5;
		this.pickerPosition = options.pickerPosition || this.element.data('picker-position') || 'bottom-right';
		this.showMeridian = options.showMeridian || this.element.data('show-meridian') || false;
		this.initialDate = options.initialDate || new Date();
		this.zIndex = options.zIndex || this.element.data('z-index') || undefined;

		this.icons = {
			leftArrow: this.fontAwesome ? 'fa-arrow-left' : (this.bootcssVer === 3 ? 'glyphicon-arrow-left' : 'icon-arrow-left'),
			rightArrow: this.fontAwesome ? 'fa-arrow-right' : (this.bootcssVer === 3 ? 'glyphicon-arrow-right' : 'icon-arrow-right')
		};
		this.icontype = this.fontAwesome ? 'fa' : 'glyphicon';

		this._attachEvents();

		this.formatViewType = "datetime";
		if ('formatViewType' in options) {
			this.formatViewType = options.formatViewType;
		} else if ('formatViewType' in this.element.data()) {
			this.formatViewType = this.element.data('formatViewType');
		}

		this.minView = 0;
		if ('minView' in options) {
			this.minView = options.minView;
		} else if ('minView' in this.element.data()) {
			this.minView = this.element.data('min-view');
		}
		this.minView = DPGlobal.convertViewMode(this.minView);

		this.maxView = DPGlobal.modes.length - 1;
		if ('maxView' in options) {
			this.maxView = options.maxView;
		} else if ('maxView' in this.element.data()) {
			this.maxView = this.element.data('max-view');
		}
		this.maxView = DPGlobal.convertViewMode(this.maxView);

		this.wheelViewModeNavigation = false;
		if ('wheelViewModeNavigation' in options) {
			this.wheelViewModeNavigation = options.wheelViewModeNavigation;
		} else if ('wheelViewModeNavigation' in this.element.data()) {
			this.wheelViewModeNavigation = this.element.data('view-mode-wheel-navigation');
		}

		this.wheelViewModeNavigationInverseDirection = false;

		if ('wheelViewModeNavigationInverseDirection' in options) {
			this.wheelViewModeNavigationInverseDirection = options.wheelViewModeNavigationInverseDirection;
		} else if ('wheelViewModeNavigationInverseDirection' in this.element.data()) {
			this.wheelViewModeNavigationInverseDirection = this.element.data('view-mode-wheel-navigation-inverse-dir');
		}

		this.wheelViewModeNavigationDelay = 100;
		if ('wheelViewModeNavigationDelay' in options) {
			this.wheelViewModeNavigationDelay = options.wheelViewModeNavigationDelay;
		} else if ('wheelViewModeNavigationDelay' in this.element.data()) {
			this.wheelViewModeNavigationDelay = this.element.data('view-mode-wheel-navigation-delay');
		}

		this.startViewMode = 2;
		if ('startView' in options) {
			this.startViewMode = options.startView;
		} else if ('startView' in this.element.data()) {
			this.startViewMode = this.element.data('start-view');
		}
		this.startViewMode = DPGlobal.convertViewMode(this.startViewMode);
		this.viewMode = this.startViewMode;

		this.viewSelect = this.minView;
		if ('viewSelect' in options) {
			this.viewSelect = options.viewSelect;
		} else if ('viewSelect' in this.element.data()) {
			this.viewSelect = this.element.data('view-select');
		}
		this.viewSelect = DPGlobal.convertViewMode(this.viewSelect);

		this.forceParse = true;
		if ('forceParse' in options) {
			this.forceParse = options.forceParse;
		} else if ('dateForceParse' in this.element.data()) {
			this.forceParse = this.element.data('date-force-parse');
		}
		var template = this.bootcssVer === 3 ? DPGlobal.templateV3 : DPGlobal.template;
		while (template.indexOf('{iconType}') !== -1) {
			template = template.replace('{iconType}', this.icontype);
		}
		while (template.indexOf('{leftArrow}') !== -1) {
			template = template.replace('{leftArrow}', this.icons.leftArrow);
		}
		while (template.indexOf('{rightArrow}') !== -1) {
			template = template.replace('{rightArrow}', this.icons.rightArrow);
		}
		this.picker = $(template)
			.appendTo(this.isInline ? this.element : this.container) // 'body')
			.on({
				click:     $.proxy(this.click, this),
				mousedown: $.proxy(this.mousedown, this)
			});

		if (this.wheelViewModeNavigation) {
			if ($.fn.mousewheel) {
				this.picker.on({mousewheel: $.proxy(this.mousewheel, this)});
			} else {
				console.log("Mouse Wheel event is not supported. Please include the jQuery Mouse Wheel plugin before enabling this option");
			}
		}

		if (this.isInline) {
			this.picker.addClass('datetimepicker-inline');
		} else {
			this.picker.addClass('datetimepicker-dropdown-' + this.pickerPosition + ' dropdown-menu');
		}
		if (this.isRTL) {
			this.picker.addClass('datetimepicker-rtl');
			var selector = this.bootcssVer === 3 ? '.prev span, .next span' : '.prev i, .next i';
			this.picker.find(selector).toggleClass(this.icons.leftArrow + ' ' + this.icons.rightArrow);
		}
		$(document).on('mousedown', function (e) {
			// Clicked outside the datetimepicker, hide it
			if ($(e.target).closest('.datetimepicker').length === 0) {
				that.hide();
			}
		});

		this.autoclose = false;
		if ('autoclose' in options) {
			this.autoclose = options.autoclose;
		} else if ('dateAutoclose' in this.element.data()) {
			this.autoclose = this.element.data('date-autoclose');
		}

		this.keyboardNavigation = true;
		if ('keyboardNavigation' in options) {
			this.keyboardNavigation = options.keyboardNavigation;
		} else if ('dateKeyboardNavigation' in this.element.data()) {
			this.keyboardNavigation = this.element.data('date-keyboard-navigation');
		}

		this.todayBtn = (options.todayBtn || this.element.data('date-today-btn') || false);
		this.todayHighlight = (options.todayHighlight || this.element.data('date-today-highlight') || false);

		this.weekStart = ((options.weekStart || this.element.data('date-weekstart') || dates[this.language].weekStart || 0) % 7);
		this.weekEnd = ((this.weekStart + 6) % 7);
		this.startDate = -Infinity;
		this.endDate = Infinity;
		this.daysOfWeekDisabled = [];
		this.setStartDate(options.startDate || this.element.data('date-startdate'));
		this.setEndDate(options.endDate || this.element.data('date-enddate'));
		this.setDaysOfWeekDisabled(options.daysOfWeekDisabled || this.element.data('date-days-of-week-disabled'));
		this.setMinutesDisabled(options.minutesDisabled || this.element.data('date-minute-disabled'));
		this.setHoursDisabled(options.hoursDisabled || this.element.data('date-hour-disabled'));
		this.fillDow();
		this.fillMonths();
		this.update();
		this.showMode();

		if (this.isInline) {
			this.show();
		}
	};

	Datetimepicker.prototype = {
		constructor: Datetimepicker,

		_events:       [],
		_attachEvents: function () {
			this._detachEvents();
			if (this.isInput) { // single input
				this._events = [
					[this.element, {
						focus:   $.proxy(this.show, this),
						keyup:   $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}]
				];
			}
			else if (this.component && this.hasInput) { // component: input + button
				this._events = [
					// For components that are not readonly, allow keyboard nav
					[this.element.find('input'), {
						focus:   $.proxy(this.show, this),
						keyup:   $.proxy(this.update, this),
						keydown: $.proxy(this.keydown, this)
					}],
					[this.component, {
						click: $.proxy(this.show, this)
					}]
				];
				if (this.componentReset) {
					this._events.push([
						this.componentReset,
						{click: $.proxy(this.reset, this)}
					]);
				}
			}
			else if (this.element.is('div')) {  // inline datetimepicker
				this.isInline = true;
			}
			else {
				this._events = [
					[this.element, {
						click: $.proxy(this.show, this)
					}]
				];
			}
			for (var i = 0, el, ev; i < this._events.length; i++) {
				el = this._events[i][0];
				ev = this._events[i][1];
				el.on(ev);
			}
		},

		_detachEvents: function () {
			for (var i = 0, el, ev; i < this._events.length; i++) {
				el = this._events[i][0];
				ev = this._events[i][1];
				el.off(ev);
			}
			this._events = [];
		},

		show: function (e) {
			this.picker.show();
			this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
			if (this.forceParse) {
				this.update();
			}
			this.place();
			$(window).on('resize', $.proxy(this.place, this));
			if (e) {
				e.stopPropagation();
				e.preventDefault();
			}
			this.isVisible = true;
			this.element.trigger({
				type: 'show',
				date: this.date
			});
		},

		hide: function (e) {
			if (!this.isVisible) return;
			if (this.isInline) return;
			this.picker.hide();
			$(window).off('resize', this.place);
			this.viewMode = this.startViewMode;
			this.showMode();
			if (!this.isInput) {
				$(document).off('mousedown', this.hide);
			}

			if (
				this.forceParse &&
					(
						this.isInput && this.element.val() ||
							this.hasInput && this.element.find('input').val()
						)
				)
				this.setValue();
			this.isVisible = false;
			this.element.trigger({
				type: 'hide',
				date: this.date
			});
		},

		remove: function () {
			this._detachEvents();
			this.picker.remove();
			delete this.picker;
			delete this.element.data().datetimepicker;
		},

		getDate: function () {
			var d = this.getUTCDate();
			return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
		},

		getUTCDate: function () {
			return this.date;
		},

		setDate: function (d) {
			this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)));
		},

		setUTCDate: function (d) {
			if (d >= this.startDate && d <= this.endDate) {
				this.date = d;
				this.setValue();
				this.viewDate = this.date;
				this.fill();
			} else {
				this.element.trigger({
					type:      'outOfRange',
					date:      d,
					startDate: this.startDate,
					endDate:   this.endDate
				});
			}
		},

		setFormat: function (format) {
			this.format = DPGlobal.parseFormat(format, this.formatType);
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component) {
				element = this.element.find('input');
			}
			if (element && element.val()) {
				this.setValue();
			}
		},

		setValue: function () {
			var formatted = this.getFormattedDate();
			if (!this.isInput) {
				if (this.component) {
					this.element.find('input').val(formatted);
				}
				this.element.data('date', formatted);
			} else {
				this.element.val(formatted);
			}
			if (this.linkField) {
				$('#' + this.linkField).val(this.getFormattedDate(this.linkFormat));
			}
		},

		getFormattedDate: function (format) {
			if (format == undefined) format = this.format;
			return DPGlobal.formatDate(this.date, format, this.language, this.formatType);
		},

		setStartDate: function (startDate) {
			this.startDate = startDate || -Infinity;
			if (this.startDate !== -Infinity) {
				this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language, this.formatType);
			}
			this.update();
			this.updateNavArrows();
		},

		setEndDate: function (endDate) {
			this.endDate = endDate || Infinity;
			if (this.endDate !== Infinity) {
				this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language, this.formatType);
			}
			this.update();
			this.updateNavArrows();
		},

		setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
			this.daysOfWeekDisabled = daysOfWeekDisabled || [];
			if (!$.isArray(this.daysOfWeekDisabled)) {
				this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
			}
			this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
				return parseInt(d, 10);
			});
			this.update();
			this.updateNavArrows();
		},

		setMinutesDisabled: function (minutesDisabled) {
			this.minutesDisabled = minutesDisabled || [];
			if (!$.isArray(this.minutesDisabled)) {
				this.minutesDisabled = this.minutesDisabled.split(/,\s*/);
			}
			this.minutesDisabled = $.map(this.minutesDisabled, function (d) {
				return parseInt(d, 10);
			});
			this.update();
			this.updateNavArrows();
		},

		setHoursDisabled: function (hoursDisabled) {
			this.hoursDisabled = hoursDisabled || [];
			if (!$.isArray(this.hoursDisabled)) {
				this.hoursDisabled = this.hoursDisabled.split(/,\s*/);
			}
			this.hoursDisabled = $.map(this.hoursDisabled, function (d) {
				return parseInt(d, 10);
			});
			this.update();
			this.updateNavArrows();
		},

		place: function () {
			if (this.isInline) return;

			if (!this.zIndex) {
				var index_highest = 0;
				$('div').each(function () {
					var index_current = parseInt($(this).css("zIndex"), 10);
					if (index_current > index_highest) {
						index_highest = index_current;
					}
				});
				this.zIndex = index_highest + 10;
			}

			var offset, top, left, containerOffset;
			if (this.container instanceof $) {
				containerOffset = this.container.offset();
			} else {
				containerOffset = $(this.container).offset();
			}

			if (this.component) {
				offset = this.component.offset();
				left = offset.left;
				if (this.pickerPosition == 'bottom-left' || this.pickerPosition == 'top-left') {
					left += this.component.outerWidth() - this.picker.outerWidth();
				}
			} else {
				offset = this.element.offset();
				left = offset.left;
			}

			if(left+220 > document.body.clientWidth){
            			left = document.body.clientWidth-220;
          		}

			if (this.pickerPosition == 'top-left' || this.pickerPosition == 'top-right') {
				top = offset.top - this.picker.outerHeight();
			} else {
				top = offset.top + this.height;
			}

			top = top - containerOffset.top;
			left = left - containerOffset.left;
			
			// top = top + document.body.scrollTop

			this.picker.css({
				top:    top,
				left:   left,
				zIndex: this.zIndex
			});
		},

		update: function () {
			var date, fromArgs = false;
			if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
				date = arguments[0];
				fromArgs = true;
			} else {
				date = (this.isInput ? this.element.val() : this.element.find('input').val()) || this.element.data('date') || this.initialDate;
				if (typeof date == 'string' || date instanceof String) {
				  date = date.replace(/^\s+|\s+$/g,'');
				}
			}

			if (!date) {
				date = new Date();
				fromArgs = false;
			}

			this.date = DPGlobal.parseDate(date, this.format, this.language, this.formatType);

			if (fromArgs) this.setValue();

			if (this.date < this.startDate) {
				this.viewDate = new Date(this.startDate);
			} else if (this.date > this.endDate) {
				this.viewDate = new Date(this.endDate);
			} else {
				this.viewDate = new Date(this.date);
			}
			this.fill();
		},

		fillDow: function () {
			var dowCnt = this.weekStart,
				html = '<tr>';
			while (dowCnt < this.weekStart + 7) {
				html += '<th class="dow">' + dates[this.language].daysMin[(dowCnt++) % 7] + '</th>';
			}
			html += '</tr>';
			this.picker.find('.datetimepicker-days thead').append(html);
		},

		fillMonths: function () {
			var html = '',
				i = 0;
			while (i < 12) {
				html += '<span class="month">' + dates[this.language].monthsShort[i++] + '</span>';
			}
			this.picker.find('.datetimepicker-months td').html(html);
		},

		fill: function () {
			if (this.date == null || this.viewDate == null) {
				return;
			}
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				dayMonth = d.getUTCDate(),
				hours = d.getUTCHours(),
				minutes = d.getUTCMinutes(),
				startYear = this.startDate !== -Infinity ? this.startDate.getUTCFullYear() : -Infinity,
				startMonth = this.startDate !== -Infinity ? this.startDate.getUTCMonth() + 1 : -Infinity,
				endYear = this.endDate !== Infinity ? this.endDate.getUTCFullYear() : Infinity,
				endMonth = this.endDate !== Infinity ? this.endDate.getUTCMonth() + 1 : Infinity,
				currentDate = (new UTCDate(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())).valueOf(),
				today = new Date();
			this.picker.find('.datetimepicker-days thead th:eq(1)')
				.text(dates[this.language].months[month] + ' ' + year);
			if (this.formatViewType == "time") {
				var formatted = this.getFormattedDate();
				this.picker.find('.datetimepicker-hours thead th:eq(1)').text(formatted);
				this.picker.find('.datetimepicker-minutes thead th:eq(1)').text(formatted);
			} else {
				this.picker.find('.datetimepicker-hours thead th:eq(1)')
					.text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
				this.picker.find('.datetimepicker-minutes thead th:eq(1)')
					.text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
			}
			this.picker.find('tfoot th.today')
				.text(dates[this.language].today)
				.toggle(this.todayBtn !== false);
			this.updateNavArrows();
			this.fillMonths();
			/*var prevMonth = UTCDate(year, month, 0,0,0,0,0);
			 prevMonth.setUTCDate(prevMonth.getDate() - (prevMonth.getUTCDay() - this.weekStart + 7)%7);*/
			var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
				day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
			var nextMonth = new Date(prevMonth);
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();
			var html = [];
			var clsName;
			while (prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() == this.weekStart) {
					html.push('<tr>');
				}
				clsName = '';
				if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month)) {
					clsName += ' old';
				} else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month)) {
					clsName += ' new';
				}
				// Compare internal UTC date with local today, not UTC today
				if (this.todayHighlight &&
					prevMonth.getUTCFullYear() == today.getFullYear() &&
					prevMonth.getUTCMonth() == today.getMonth() &&
					prevMonth.getUTCDate() == today.getDate()) {
					clsName += ' today';
				}
				if (prevMonth.valueOf() == currentDate) {
					clsName += ' active';
				}
				if ((prevMonth.valueOf() + 86400000) <= this.startDate || prevMonth.valueOf() > this.endDate ||
					$.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1) {
					clsName += ' disabled';
				}
				html.push('<td class="day' + clsName + '">' + prevMonth.getUTCDate() + '</td>');
				if (prevMonth.getUTCDay() == this.weekEnd) {
					html.push('</tr>');
				}
				prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
			}
			this.picker.find('.datetimepicker-days tbody').empty().append(html.join(''));

			html = [];
			var txt = '', meridian = '', meridianOld = '';
			var hoursDisabled = this.hoursDisabled || [];
			for (var i = 0; i < 24; i++) {
				if (hoursDisabled.indexOf(i) !== -1) continue;
				var actual = UTCDate(year, month, dayMonth, i);
				clsName = '';
				// We want the previous hour for the startDate
				if ((actual.valueOf() + 3600000) <= this.startDate || actual.valueOf() > this.endDate) {
					clsName += ' disabled';
				} else if (hours == i) {
					clsName += ' active';
				}
				if (this.showMeridian && dates[this.language].meridiem.length == 2) {
					meridian = (i < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
					if (meridian != meridianOld) {
						if (meridianOld != '') {
							html.push('</fieldset>');
						}
						html.push('<fieldset class="hour"><legend>' + meridian.toUpperCase() + '</legend>');
					}
					meridianOld = meridian;
					txt = (i % 12 ? i % 12 : 12);
					html.push('<span class="hour' + clsName + ' hour_' + (i < 12 ? 'am' : 'pm') + '">' + txt + '</span>');
					if (i == 23) {
						html.push('</fieldset>');
					}
				} else {
					txt = i + ':00';
					html.push('<span class="hour' + clsName + '">' + txt + '</span>');
				}
			}
			this.picker.find('.datetimepicker-hours td').html(html.join(''));

			html = [];
			txt = '', meridian = '', meridianOld = '';
			var minutesDisabled = this.minutesDisabled || [];
			for (var i = 0; i < 60; i += this.minuteStep) {
				if (minutesDisabled.indexOf(i) !== -1) continue;
				var actual = UTCDate(year, month, dayMonth, hours, i, 0);
				clsName = '';
				if (actual.valueOf() < this.startDate || actual.valueOf() > this.endDate) {
					clsName += ' disabled';
				} else if (Math.floor(minutes / this.minuteStep) == Math.floor(i / this.minuteStep)) {
					clsName += ' active';
				}
				if (this.showMeridian && dates[this.language].meridiem.length == 2) {
					meridian = (hours < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
					if (meridian != meridianOld) {
						if (meridianOld != '') {
							html.push('</fieldset>');
						}
						html.push('<fieldset class="minute"><legend>' + meridian.toUpperCase() + '</legend>');
					}
					meridianOld = meridian;
					txt = (hours % 12 ? hours % 12 : 12);
					//html.push('<span class="minute'+clsName+' minute_'+(hours<12?'am':'pm')+'">'+txt+'</span>');
					html.push('<span class="minute' + clsName + '">' + txt + ':' + (i < 10 ? '0' + i : i) + '</span>');
					if (i == 59) {
						html.push('</fieldset>');
					}
				} else {
					txt = i + ':00';
					//html.push('<span class="hour'+clsName+'">'+txt+'</span>');
					html.push('<span class="minute' + clsName + '">' + hours + ':' + (i < 10 ? '0' + i : i) + '</span>');
				}
			}
			this.picker.find('.datetimepicker-minutes td').html(html.join(''));

			var currentYear = this.date.getUTCFullYear();
			var months = this.picker.find('.datetimepicker-months')
				.find('th:eq(1)')
				.text(year)
				.end()
				.find('span').removeClass('active');
			if (currentYear == year) {
				// getUTCMonths() returns 0 based, and we need to select the next one
				months.eq(this.date.getUTCMonth() + 2).addClass('active');
			}
			if (year < startYear || year > endYear) {
				months.addClass('disabled');
			}
			if (year == startYear) {
				months.slice(0, startMonth + 1).addClass('disabled');
			}
			if (year == endYear) {
				months.slice(endMonth).addClass('disabled');
			}

			html = '';
			year = parseInt(year / 10, 10) * 10;
			var yearCont = this.picker.find('.datetimepicker-years')
				.find('th:eq(1)')
				.text(year + '-' + (year + 9))
				.end()
				.find('td');
			year -= 1;
			for (var i = -1; i < 11; i++) {
				html += '<span class="year' + (i == -1 || i == 10 ? ' old' : '') + (currentYear == year ? ' active' : '') + (year < startYear || year > endYear ? ' disabled' : '') + '">' + year + '</span>';
				year += 1;
			}
			yearCont.html(html);
			this.place();
		},

		updateNavArrows: function () {
			var d = new Date(this.viewDate),
				year = d.getUTCFullYear(),
				month = d.getUTCMonth(),
				day = d.getUTCDate(),
				hour = d.getUTCHours();
			switch (this.viewMode) {
				case 0:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
						&& month <= this.startDate.getUTCMonth()
						&& day <= this.startDate.getUTCDate()
						&& hour <= this.startDate.getUTCHours()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
						&& month >= this.endDate.getUTCMonth()
						&& day >= this.endDate.getUTCDate()
						&& hour >= this.endDate.getUTCHours()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 1:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
						&& month <= this.startDate.getUTCMonth()
						&& day <= this.startDate.getUTCDate()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
						&& month >= this.endDate.getUTCMonth()
						&& day >= this.endDate.getUTCDate()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 2:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()
						&& month <= this.startDate.getUTCMonth()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()
						&& month >= this.endDate.getUTCMonth()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
				case 3:
				case 4:
					if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()) {
						this.picker.find('.prev').css({visibility: 'hidden'});
					} else {
						this.picker.find('.prev').css({visibility: 'visible'});
					}
					if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()) {
						this.picker.find('.next').css({visibility: 'hidden'});
					} else {
						this.picker.find('.next').css({visibility: 'visible'});
					}
					break;
			}
		},

		mousewheel: function (e) {

			e.preventDefault();
			e.stopPropagation();

			if (this.wheelPause) {
				return;
			}

			this.wheelPause = true;

			var originalEvent = e.originalEvent;

			var delta = originalEvent.wheelDelta;

			var mode = delta > 0 ? 1 : (delta === 0) ? 0 : -1;

			if (this.wheelViewModeNavigationInverseDirection) {
				mode = -mode;
			}

			this.showMode(mode);

			setTimeout($.proxy(function () {

				this.wheelPause = false

			}, this), this.wheelViewModeNavigationDelay);

		},

		click: function (e) {
			e.stopPropagation();
			e.preventDefault();
			var target = $(e.target).closest('span, td, th, legend');
			if (target.is('.' + this.icontype)) {
				target = $(target).parent().closest('span, td, th, legend');
			}
			if (target.length == 1) {
				if (target.is('.disabled')) {
					this.element.trigger({
						type:      'outOfRange',
						date:      this.viewDate,
						startDate: this.startDate,
						endDate:   this.endDate
					});
					return;
				}
				switch (target[0].nodeName.toLowerCase()) {
					case 'th':
						switch (target[0].className) {
							case 'switch':
								this.showMode(1);
								break;
							case 'prev':
							case 'next':
								var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
								switch (this.viewMode) {
									case 0:
										this.viewDate = this.moveHour(this.viewDate, dir);
										break;
									case 1:
										this.viewDate = this.moveDate(this.viewDate, dir);
										break;
									case 2:
										this.viewDate = this.moveMonth(this.viewDate, dir);
										break;
									case 3:
									case 4:
										this.viewDate = this.moveYear(this.viewDate, dir);
										break;
								}
								this.fill();
								this.element.trigger({
									type:      target[0].className + ':' + this.convertViewModeText(this.viewMode),
									date:      this.viewDate,
									startDate: this.startDate,
									endDate:   this.endDate
								});
								break;
							case 'today':
								var date = new Date();
								date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0);

								// Respect startDate and endDate.
								if (date < this.startDate) date = this.startDate;
								else if (date > this.endDate) date = this.endDate;

								this.viewMode = this.startViewMode;
								this.showMode(0);
								this._setDate(date);
								this.fill();
								if (this.autoclose) {
									this.hide();
								}
								break;
						}
						break;
					case 'span':
						if (!target.is('.disabled')) {
							var year = this.viewDate.getUTCFullYear(),
								month = this.viewDate.getUTCMonth(),
								day = this.viewDate.getUTCDate(),
								hours = this.viewDate.getUTCHours(),
								minutes = this.viewDate.getUTCMinutes(),
								seconds = this.viewDate.getUTCSeconds();

							if (target.is('.month')) {
								this.viewDate.setUTCDate(1);
								month = target.parent().find('span').index(target);
								day = this.viewDate.getUTCDate();
								this.viewDate.setUTCMonth(month);
								this.element.trigger({
									type: 'changeMonth',
									date: this.viewDate
								});
								if (this.viewSelect >= 3) {
									this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
								}
							} else if (target.is('.year')) {
								this.viewDate.setUTCDate(1);
								year = parseInt(target.text(), 10) || 0;
								this.viewDate.setUTCFullYear(year);
								this.element.trigger({
									type: 'changeYear',
									date: this.viewDate
								});
								if (this.viewSelect >= 4) {
									this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
								}
							} else if (target.is('.hour')) {
								hours = parseInt(target.text(), 10) || 0;
								if (target.hasClass('hour_am') || target.hasClass('hour_pm')) {
									if (hours == 12 && target.hasClass('hour_am')) {
										hours = 0;
									} else if (hours != 12 && target.hasClass('hour_pm')) {
										hours += 12;
									}
								}
								this.viewDate.setUTCHours(hours);
								this.element.trigger({
									type: 'changeHour',
									date: this.viewDate
								});
								if (this.viewSelect >= 1) {
									this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
								}
							} else if (target.is('.minute')) {
								minutes = parseInt(target.text().substr(target.text().indexOf(':') + 1), 10) || 0;
								this.viewDate.setUTCMinutes(minutes);
								this.element.trigger({
									type: 'changeMinute',
									date: this.viewDate
								});
								if (this.viewSelect >= 0) {
									this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
								}
							}
							if (this.viewMode != 0) {
								var oldViewMode = this.viewMode;
								this.showMode(-1);
								this.fill();
								if (oldViewMode == this.viewMode && this.autoclose) {
									this.hide();
								}
							} else {
								this.fill();
								if (this.autoclose) {
									this.hide();
								}
							}
						}
						break;
					case 'td':
						if (target.is('.day') && !target.is('.disabled')) {
							var day = parseInt(target.text(), 10) || 1;
							var year = this.viewDate.getUTCFullYear(),
								month = this.viewDate.getUTCMonth(),
								hours = this.viewDate.getUTCHours(),
								minutes = this.viewDate.getUTCMinutes(),
								seconds = this.viewDate.getUTCSeconds();
							if (target.is('.old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.is('.new')) {
								if (month == 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this.viewDate.setUTCFullYear(year);
							this.viewDate.setUTCMonth(month, day);
							this.element.trigger({
								type: 'changeDay',
								date: this.viewDate
							});
							if (this.viewSelect >= 2) {
								this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
							}
						}
						var oldViewMode = this.viewMode;
						this.showMode(-1);
						this.fill();
						if (oldViewMode == this.viewMode && this.autoclose) {
							this.hide();
						}
						break;
				}
			}
		},

		_setDate: function (date, which) {
			if (!which || which == 'date')
				this.date = date;
			if (!which || which == 'view')
				this.viewDate = date;
			this.fill();
			this.setValue();
			var element;
			if (this.isInput) {
				element = this.element;
			} else if (this.component) {
				element = this.element.find('input');
			}
			if (element) {
				element.change();
				if (this.autoclose && (!which || which == 'date')) {
					//this.hide();
				}
			}
			this.element.trigger({
				type: 'changeDate',
				date: this.date
			});
		},

		moveMinute: function (date, dir) {
			if (!dir) return date;
			var new_date = new Date(date.valueOf());
			//dir = dir > 0 ? 1 : -1;
			new_date.setUTCMinutes(new_date.getUTCMinutes() + (dir * this.minuteStep));
			return new_date;
		},

		moveHour: function (date, dir) {
			if (!dir) return date;
			var new_date = new Date(date.valueOf());
			//dir = dir > 0 ? 1 : -1;
			new_date.setUTCHours(new_date.getUTCHours() + dir);
			return new_date;
		},

		moveDate: function (date, dir) {
			if (!dir) return date;
			var new_date = new Date(date.valueOf());
			//dir = dir > 0 ? 1 : -1;
			new_date.setUTCDate(new_date.getUTCDate() + dir);
			return new_date;
		},

		moveMonth: function (date, dir) {
			if (!dir) return date;
			var new_date = new Date(date.valueOf()),
				day = new_date.getUTCDate(),
				month = new_date.getUTCMonth(),
				mag = Math.abs(dir),
				new_month, test;
			dir = dir > 0 ? 1 : -1;
			if (mag == 1) {
				test = dir == -1
					// If going back one month, make sure month is not current month
					// (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
					? function () {
					return new_date.getUTCMonth() == month;
				}
					// If going forward one month, make sure month is as expected
					// (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
					: function () {
					return new_date.getUTCMonth() != new_month;
				};
				new_month = month + dir;
				new_date.setUTCMonth(new_month);
				// Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
				if (new_month < 0 || new_month > 11)
					new_month = (new_month + 12) % 12;
			} else {
				// For magnitudes >1, move one month at a time...
				for (var i = 0; i < mag; i++)
					// ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
					new_date = this.moveMonth(new_date, dir);
				// ...then reset the day, keeping it in the new month
				new_month = new_date.getUTCMonth();
				new_date.setUTCDate(day);
				test = function () {
					return new_month != new_date.getUTCMonth();
				};
			}
			// Common date-resetting loop -- if date is beyond end of month, make it
			// end of month
			while (test()) {
				new_date.setUTCDate(--day);
				new_date.setUTCMonth(new_month);
			}
			return new_date;
		},

		moveYear: function (date, dir) {
			return this.moveMonth(date, dir * 12);
		},

		dateWithinRange: function (date) {
			return date >= this.startDate && date <= this.endDate;
		},

		keydown: function (e) {
			if (this.picker.is(':not(:visible)')) {
				if (e.keyCode == 27) // allow escape to hide and re-show picker
					this.show();
				return;
			}
			var dateChanged = false,
				dir, day, month,
				newDate, newViewDate;
			switch (e.keyCode) {
				case 27: // escape
					this.hide();
					e.preventDefault();
					break;
				case 37: // left
				case 39: // right
					if (!this.keyboardNavigation) break;
					dir = e.keyCode == 37 ? -1 : 1;
					viewMode = this.viewMode;
					if (e.ctrlKey) {
						viewMode += 2;
					} else if (e.shiftKey) {
						viewMode += 1;
					}
					if (viewMode == 4) {
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (viewMode == 3) {
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else if (viewMode == 2) {
						newDate = this.moveDate(this.date, dir);
						newViewDate = this.moveDate(this.viewDate, dir);
					} else if (viewMode == 1) {
						newDate = this.moveHour(this.date, dir);
						newViewDate = this.moveHour(this.viewDate, dir);
					} else if (viewMode == 0) {
						newDate = this.moveMinute(this.date, dir);
						newViewDate = this.moveMinute(this.viewDate, dir);
					}
					if (this.dateWithinRange(newDate)) {
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 38: // up
				case 40: // down
					if (!this.keyboardNavigation) break;
					dir = e.keyCode == 38 ? -1 : 1;
					viewMode = this.viewMode;
					if (e.ctrlKey) {
						viewMode += 2;
					} else if (e.shiftKey) {
						viewMode += 1;
					}
					if (viewMode == 4) {
						newDate = this.moveYear(this.date, dir);
						newViewDate = this.moveYear(this.viewDate, dir);
					} else if (viewMode == 3) {
						newDate = this.moveMonth(this.date, dir);
						newViewDate = this.moveMonth(this.viewDate, dir);
					} else if (viewMode == 2) {
						newDate = this.moveDate(this.date, dir * 7);
						newViewDate = this.moveDate(this.viewDate, dir * 7);
					} else if (viewMode == 1) {
						if (this.showMeridian) {
							newDate = this.moveHour(this.date, dir * 6);
							newViewDate = this.moveHour(this.viewDate, dir * 6);
						} else {
							newDate = this.moveHour(this.date, dir * 4);
							newViewDate = this.moveHour(this.viewDate, dir * 4);
						}
					} else if (viewMode == 0) {
						newDate = this.moveMinute(this.date, dir * 4);
						newViewDate = this.moveMinute(this.viewDate, dir * 4);
					}
					if (this.dateWithinRange(newDate)) {
						this.date = newDate;
						this.viewDate = newViewDate;
						this.setValue();
						this.update();
						e.preventDefault();
						dateChanged = true;
					}
					break;
				case 13: // enter
					if (this.viewMode != 0) {
						var oldViewMode = this.viewMode;
						this.showMode(-1);
						this.fill();
						if (oldViewMode == this.viewMode && this.autoclose) {
							this.hide();
						}
					} else {
						this.fill();
						if (this.autoclose) {
							this.hide();
						}
					}
					e.preventDefault();
					break;
				case 9: // tab
					this.hide();
					break;
			}
			if (dateChanged) {
				var element;
				if (this.isInput) {
					element = this.element;
				} else if (this.component) {
					element = this.element.find('input');
				}
				if (element) {
					element.change();
				}
				this.element.trigger({
					type: 'changeDate',
					date: this.date
				});
			}
		},

		showMode: function (dir) {
			if (dir) {
				var newViewMode = Math.max(0, Math.min(DPGlobal.modes.length - 1, this.viewMode + dir));
				if (newViewMode >= this.minView && newViewMode <= this.maxView) {
					this.element.trigger({
						type:        'changeMode',
						date:        this.viewDate,
						oldViewMode: this.viewMode,
						newViewMode: newViewMode
					});

					this.viewMode = newViewMode;
				}
			}
			/*
			 vitalets: fixing bug of very special conditions:
			 jquery 1.7.1 + webkit + show inline datetimepicker in bootstrap popover.
			 Method show() does not set display css correctly and datetimepicker is not shown.
			 Changed to .css('display', 'block') solve the problem.
			 See https://github.com/vitalets/x-editable/issues/37

			 In jquery 1.7.2+ everything works fine.
			 */
			//this.picker.find('>div').hide().filter('.datetimepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
			this.picker.find('>div').hide().filter('.datetimepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
			this.updateNavArrows();
		},

		reset: function (e) {
			this._setDate(null, 'date');
		},

		convertViewModeText:  function (viewMode) {
			switch (viewMode) {
				case 4:
					return 'decade';
				case 3:
					return 'year';
				case 2:
					return 'month';
				case 1:
					return 'day';
				case 0:
					return 'hour';
			}
		}
	};

	var old = $.fn.datetimepicker;
	$.fn.datetimepicker = function (option) {
		var args = Array.apply(null, arguments);
		args.shift();
		var internal_return;
		this.each(function () {
			var $this = $(this),
				data = $this.data('datetimepicker'),
				options = typeof option == 'object' && option;
			if (!data) {
				$this.data('datetimepicker', (data = new Datetimepicker(this, $.extend({}, $.fn.datetimepicker.defaults, options))));
			}
			if (typeof option == 'string' && typeof data[option] == 'function') {
				internal_return = data[option].apply(data, args);
				if (internal_return !== undefined) {
					return false;
				}
			}
		});
		if (internal_return !== undefined)
			return internal_return;
		else
			return this;
	};

	$.fn.datetimepicker.defaults = {
		autoclose: true,
		language: "zh-CN",
		todayBtn: true,
		todayHighlight: true,
		fontAwesome: true,
		bootcssVer: 3


	};
	$.fn.datetimepicker.Constructor = Datetimepicker;
	var dates = $.fn.datetimepicker.dates = {
		en: {
			days:        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			daysShort:   ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			daysMin:     ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
			months:      ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			meridiem:    ["am", "pm"],
			suffix:      ["st", "nd", "rd", "th"],
			today:       "Today"
		}
	};

	var DPGlobal = {
		modes:            [
			{
				clsName: 'minutes',
				navFnc:  'Hours',
				navStep: 1
			},
			{
				clsName: 'hours',
				navFnc:  'Date',
				navStep: 1
			},
			{
				clsName: 'days',
				navFnc:  'Month',
				navStep: 1
			},
			{
				clsName: 'months',
				navFnc:  'FullYear',
				navStep: 1
			},
			{
				clsName: 'years',
				navFnc:  'FullYear',
				navStep: 10
			}
		],
		isLeapYear:       function (year) {
			return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
		},
		getDaysInMonth:   function (year, month) {
			return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
		},
		getDefaultFormat: function (type, field) {
			if (type == "standard") {
				if (field == 'input')
					return 'yyyy-mm-dd hh:ii';
				else
					return 'yyyy-mm-dd hh:ii:ss';
			} else if (type == "php") {
				if (field == 'input')
					return 'Y-m-d H:i';
				else
					return 'Y-m-d H:i:s';
			} else {
				throw new Error("Invalid format type.");
			}
		},
		validParts:       function (type) {
			if (type == "standard") {
				return /hh?|HH?|p|P|ii?|ss?|dd?|DD?|mm?|MM?|yy(?:yy)?/g;
			} else if (type == "php") {
				return /[dDjlNwzFmMnStyYaABgGhHis]/g;
			} else {
				throw new Error("Invalid format type.");
			}
		},
		nonpunctuation:   /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
		parseFormat:      function (format, type) {
			// IE treats \0 as a string end in inputs (truncating the value),
			// so it's a bad format delimiter, anyway
			var separators = format.replace(this.validParts(type), '\0').split('\0'),
				parts = format.match(this.validParts(type));
			if (!separators || !separators.length || !parts || parts.length == 0) {
				throw new Error("Invalid date format.");
			}
			return {separators: separators, parts: parts};
		},
		parseDate:        function (date, format, language, type) {
			if (date instanceof Date) {
				var dateUTC = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
				dateUTC.setMilliseconds(0);
				return dateUTC;
			}
			if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
				format = this.parseFormat('yyyy-mm-dd', type);
			}
			if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
				format = this.parseFormat('yyyy-mm-dd hh:ii', type);
			}
			if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
				format = this.parseFormat('yyyy-mm-dd hh:ii:ss', type);
			}
			if (/^[-+]\d+[dmwy]([\s,]+[-+]\d+[dmwy])*$/.test(date)) {
				var part_re = /([-+]\d+)([dmwy])/,
					parts = date.match(/([-+]\d+)([dmwy])/g),
					part, dir;
				date = new Date();
				for (var i = 0; i < parts.length; i++) {
					part = part_re.exec(parts[i]);
					dir = parseInt(part[1]);
					switch (part[2]) {
						case 'd':
							date.setUTCDate(date.getUTCDate() + dir);
							break;
						case 'm':
							date = Datetimepicker.prototype.moveMonth.call(Datetimepicker.prototype, date, dir);
							break;
						case 'w':
							date.setUTCDate(date.getUTCDate() + dir * 7);
							break;
						case 'y':
							date = Datetimepicker.prototype.moveYear.call(Datetimepicker.prototype, date, dir);
							break;
					}
				}
				return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), 0);
			}
			var parts = date && date.toString().match(this.nonpunctuation) || [],
				date = new Date(0, 0, 0, 0, 0, 0, 0),
				parsed = {},
				setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'D', 'DD', 'd', 'dd', 'H', 'HH', 'p', 'P'],
				setters_map = {
					hh:   function (d, v) {
						return d.setUTCHours(v);
					},
					h:    function (d, v) {
						return d.setUTCHours(v);
					},
					HH:   function (d, v) {
						return d.setUTCHours(v == 12 ? 0 : v);
					},
					H:    function (d, v) {
						return d.setUTCHours(v == 12 ? 0 : v);
					},
					ii:   function (d, v) {
						return d.setUTCMinutes(v);
					},
					i:    function (d, v) {
						return d.setUTCMinutes(v);
					},
					ss:   function (d, v) {
						return d.setUTCSeconds(v);
					},
					s:    function (d, v) {
						return d.setUTCSeconds(v);
					},
					yyyy: function (d, v) {
						return d.setUTCFullYear(v);
					},
					yy:   function (d, v) {
						return d.setUTCFullYear(2000 + v);
					},
					m:    function (d, v) {
						v -= 1;
						while (v < 0) v += 12;
						v %= 12;
						d.setUTCMonth(v);
						while (d.getUTCMonth() != v)
							if (isNaN(d.getUTCMonth()))
								return d;
							else
								d.setUTCDate(d.getUTCDate() - 1);
						return d;
					},
					d:    function (d, v) {
						return d.setUTCDate(v);
					},
					p:    function (d, v) {
						return d.setUTCHours(v == 1 ? d.getUTCHours() + 12 : d.getUTCHours());
					}
				},
				val, filtered, part;
			setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
			setters_map['dd'] = setters_map['d'];
			setters_map['P'] = setters_map['p'];
			date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
			if (parts.length == format.parts.length) {
				for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
					val = parseInt(parts[i], 10);
					part = format.parts[i];
					if (isNaN(val)) {
						switch (part) {
							case 'MM':
								filtered = $(dates[language].months).filter(function () {
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m == p;
								});
								val = $.inArray(filtered[0], dates[language].months) + 1;
								break;
							case 'M':
								filtered = $(dates[language].monthsShort).filter(function () {
									var m = this.slice(0, parts[i].length),
										p = parts[i].slice(0, m.length);
									return m.toLowerCase() == p.toLowerCase();
								});
								val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
								break;
							case 'p':
							case 'P':
								val = $.inArray(parts[i].toLowerCase(), dates[language].meridiem);
								break;
						}
					}
					parsed[part] = val;
				}
				for (var i = 0, s; i < setters_order.length; i++) {
					s = setters_order[i];
					if (s in parsed && !isNaN(parsed[s]))
						setters_map[s](date, parsed[s])
				}
			}
			return date;
		},
		formatDate:       function (date, format, language, type) {
			if (date == null) {
				return '';
			}
			var val;
			if (type == 'standard') {
				val = {
					// year
					yy:   date.getUTCFullYear().toString().substring(2),
					yyyy: date.getUTCFullYear(),
					// month
					m:    date.getUTCMonth() + 1,
					M:    dates[language].monthsShort[date.getUTCMonth()],
					MM:   dates[language].months[date.getUTCMonth()],
					// day
					d:    date.getUTCDate(),
					D:    dates[language].daysShort[date.getUTCDay()],
					DD:   dates[language].days[date.getUTCDay()],
					p:    (dates[language].meridiem.length == 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
					// hour
					h:    date.getUTCHours(),
					// minute
					i:    date.getUTCMinutes(),
					// second
					s:    date.getUTCSeconds()
				};

				if (dates[language].meridiem.length == 2) {
					val.H = (val.h % 12 == 0 ? 12 : val.h % 12);
				}
				else {
					val.H = val.h;
				}
				val.HH = (val.H < 10 ? '0' : '') + val.H;
				val.P = val.p.toUpperCase();
				val.hh = (val.h < 10 ? '0' : '') + val.h;
				val.ii = (val.i < 10 ? '0' : '') + val.i;
				val.ss = (val.s < 10 ? '0' : '') + val.s;
				val.dd = (val.d < 10 ? '0' : '') + val.d;
				val.mm = (val.m < 10 ? '0' : '') + val.m;
			} else if (type == 'php') {
				// php format
				val = {
					// year
					y: date.getUTCFullYear().toString().substring(2),
					Y: date.getUTCFullYear(),
					// month
					F: dates[language].months[date.getUTCMonth()],
					M: dates[language].monthsShort[date.getUTCMonth()],
					n: date.getUTCMonth() + 1,
					t: DPGlobal.getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth()),
					// day
					j: date.getUTCDate(),
					l: dates[language].days[date.getUTCDay()],
					D: dates[language].daysShort[date.getUTCDay()],
					w: date.getUTCDay(), // 0 -> 6
					N: (date.getUTCDay() == 0 ? 7 : date.getUTCDay()),       // 1 -> 7
					S: (date.getUTCDate() % 10 <= dates[language].suffix.length ? dates[language].suffix[date.getUTCDate() % 10 - 1] : ''),
					// hour
					a: (dates[language].meridiem.length == 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
					g: (date.getUTCHours() % 12 == 0 ? 12 : date.getUTCHours() % 12),
					G: date.getUTCHours(),
					// minute
					i: date.getUTCMinutes(),
					// second
					s: date.getUTCSeconds()
				};
				val.m = (val.n < 10 ? '0' : '') + val.n;
				val.d = (val.j < 10 ? '0' : '') + val.j;
				val.A = val.a.toString().toUpperCase();
				val.h = (val.g < 10 ? '0' : '') + val.g;
				val.H = (val.G < 10 ? '0' : '') + val.G;
				val.i = (val.i < 10 ? '0' : '') + val.i;
				val.s = (val.s < 10 ? '0' : '') + val.s;
			} else {
				throw new Error("Invalid format type.");
			}
			var date = [],
				seps = $.extend([], format.separators);
			for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
				if (seps.length) {
					date.push(seps.shift());
				}
				date.push(val[format.parts[i]]);
			}
			if (seps.length) {
				date.push(seps.shift());
			}
			return date.join('');
		},
		convertViewMode:  function (viewMode) {
			switch (viewMode) {
				case 4:
				case 'decade':
					viewMode = 4;
					break;
				case 3:
				case 'year':
					viewMode = 3;
					break;
				case 2:
				case 'month':
					viewMode = 2;
					break;
				case 1:
				case 'day':
					viewMode = 1;
					break;
				case 0:
				case 'hour':
					viewMode = 0;
					break;
			}

			return viewMode;
		},
		headTemplate:     '<thead>' +
							  '<tr>' +
							  '<th class="prev"><i class="{leftArrow}"/></th>' +
							  '<th colspan="5" class="switch"></th>' +
							  '<th class="next"><i class="{rightArrow}"/></th>' +
							  '</tr>' +
			'</thead>',
		headTemplateV3:   '<thead>' +
							  '<tr>' +
							  '<th class="prev"><span class="{iconType} {leftArrow}"></span> </th>' +
							  '<th colspan="5" class="switch"></th>' +
							  '<th class="next"><span class="{iconType} {rightArrow}"></span> </th>' +
							  '</tr>' +
			'</thead>',
		contTemplate:     '<tbody><tr><td colspan="7"></td></tr></tbody>',
		footTemplate:     '<tfoot><tr><th colspan="7" class="today"></th></tr></tfoot>'
	};
	DPGlobal.template = '<div class="datetimepicker">' +
		'<div class="datetimepicker-minutes">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-hours">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-days">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplate +
		'<tbody></tbody>' +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-months">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-years">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplate +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'</div>';
	DPGlobal.templateV3 = '<div class="datetimepicker">' +
		'<div class="datetimepicker-minutes">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplateV3 +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-hours">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplateV3 +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-days">' +
		'<table class=" table-condensed">' +
		DPGlobal.headTemplateV3 +
		'<tbody></tbody>' +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-months">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplateV3 +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'<div class="datetimepicker-years">' +
		'<table class="table-condensed">' +
		DPGlobal.headTemplateV3 +
		DPGlobal.contTemplate +
		DPGlobal.footTemplate +
		'</table>' +
		'</div>' +
		'</div>';
	$.fn.datetimepicker.DPGlobal = DPGlobal;

	/* DATETIMEPICKER NO CONFLICT
	 * =================== */

	$.fn.datetimepicker.noConflict = function () {
		$.fn.datetimepicker = old;
		return this;
	};

	/* DATETIMEPICKER DATA-API
	 * ================== */

	$(document).on(
		'focus.datetimepicker.data-api click.datetimepicker.data-api',
		'[data-provide="datetimepicker"]',
		function (e) {
			var $this = $(this);
			if ($this.data('datetimepicker')) return;
			e.preventDefault();
			// component click requires us to explicitly show it
			$this.datetimepicker('show');
		}
	);
	$(function () {
		$('[data-provide="datetimepicker-inline"]').datetimepicker();
	});

}(window.jQuery);

/**
* Arabic translation for bootstrap-datetimepicker
* Ala' Mohammad <amohammad@birzeit.ecu>
*/
;(function($){
	$.fn.datetimepicker.dates['ar'] = {
		days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
		daysShort: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت", "أحد"],
		daysMin: ["أح", "إث", "ث", "أر", "خ", "ج", "س", "أح"],
		months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
		monthsShort: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
		today: "هذا اليوم",
		suffix: [],
		meridiem: [],
		rtl: true
	};
}(jQuery));

/**
 * Bulgarian translation for bootstrap-datetimepicker
 * Apostol Apostolov <apostol.s.apostolov@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['bg'] = {
		days: ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота", "Неделя"],
		daysShort: ["Нед", "Пон", "Вто", "Сря", "Чет", "Пет", "Съб", "Нед"],
		daysMin: ["Н", "П", "В", "С", "Ч", "П", "С", "Н"],
		months: ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"],
		monthsShort: ["Ян", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"],
		today: "днес",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Catalan translation for bootstrap-datetimepicker
 * J. Garcia <jogaco.en@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['ca'] = {
		days: ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"],
		daysShort: ["Diu",  "Dil", "Dmt", "Dmc", "Dij", "Div", "Dis", "Diu"],
		daysMin: ["dg", "dl", "dt", "dc", "dj", "dv", "ds", "dg"],
		months: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
		monthsShort: ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"],
		today: "Avui",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Czech translation for bootstrap-datetimepicker
 * Matěj Koubík <matej@koubik.name>
 * Fixes by Michal Remiš <michal.remis@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['cs'] = {
		days: ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"],
		daysShort: ["Ned", "Pon", "Úte", "Stř", "Čtv", "Pát", "Sob", "Ned"],
		daysMin: ["Ne", "Po", "Út", "St", "Čt", "Pá", "So", "Ne"],
		months: ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"],
		monthsShort: ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Čnc", "Srp", "Zář", "Říj", "Lis", "Pro"],
		today: "Dnes",
		suffix: [],
		meridiem: [],
		weekStart: 1,
		format: "dd.mm.yyyy"
	};
}(jQuery));

/**
 * Danish translation for bootstrap-datetimepicker
 * Christian Pedersen <http://github.com/chripede>
 */
;(function($){
	$.fn.datetimepicker.dates['da'] = {
		days: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"],
		daysShort: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"],
		daysMin: ["Sø", "Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"],
		months: ["Januar", "Februar", "Marts", "April", "Maj", "Juni", "Juli", "August", "September", "Oktober", "November", "December"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
		today: "I Dag",
		suffix: [],
		meridiem: []
	};
}(jQuery));
/**
 * German translation for bootstrap-datetimepicker
 * Sam Zurcher <sam@orelias.ch>
 */
;(function($){
	$.fn.datetimepicker.dates['de'] = {
		days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
		daysShort: ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam", "Son"],
		daysMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
		months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
		monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
		today: "Heute",
		suffix: [],
		meridiem: [],
		weekStart: 1,
		format: "dd.mm.yyyy"
	};
}(jQuery));

/**
 * Estonian translation for bootstrap-datetimepicker
 * Rene Korss <http://rene.korss.ee> 
 */
;(function($){
	$.fn.datetimepicker.dates['ee'] = {
		days:        	["Pühapäev", "Esmaspäev", "Teisipäev", "Kolmapäev", "Neljapäev", "Reede", "Laupäev", "Pühapäev"],
		daysShort:   	["P", "E", "T", "K", "N", "R", "L", "P"],
		daysMin:     	["P", "E", "T", "K", "N", "R", "L", "P"],
		months:      	["Jaanuar", "Veebruar", "Märts", "Aprill", "Mai", "Juuni", "Juuli", "August", "September", "Oktoober", "November", "Detsember"],
		monthsShort: 	["Jaan", "Veebr", "Märts", "Apr", "Mai", "Juuni", "Juuli", "Aug", "Sept", "Okt", "Nov", "Dets"],
		today:       	"Täna",
		suffix:     	[],
		meridiem: 		[],
		weekStart: 		1,
		format: 		"dd.mm.yyyy hh:ii"
	};
}(jQuery));
/**
* Greek translation for bootstrap-datetimepicker
*/
;(function($){
  $.fn.datetimepicker.dates['el'] = {
	    days: ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"],
	    daysShort: ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"],
	    daysMin: ["Κυ", "Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"],
	    months: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"],
	    monthsShort: ["Ιαν", "Φεβ", "Μαρ", "Απρ", "Μάι", "Ιουν", "Ιουλ", "Αυγ", "Σεπ", "Οκτ", "Νοε", "Δεκ"],
	    today: "Σήμερα",
		suffix: [],
		meridiem: []
  };
}(jQuery));
/**
 * Spanish translation for bootstrap-datetimepicker
 * Bruno Bonamin <bruno.bonamin@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['es'] = {
		days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
		daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
		daysMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"],
		months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
		monthsShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
		today: "Hoy",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Finnish translation for bootstrap-datetimepicker
 * Jaakko Salonen <https://github.com/jsalonen>
 */
;(function($){
	$.fn.datetimepicker.dates['fi'] = {
		days: ["sunnuntai", "maanantai", "tiistai", "keskiviikko", "torstai", "perjantai", "lauantai", "sunnuntai"],
		daysShort: ["sun", "maa", "tii", "kes", "tor", "per", "lau", "sun"],
		daysMin: ["su", "ma", "ti", "ke", "to", "pe", "la", "su"],
		months: ["tammikuu", "helmikuu", "maaliskuu", "huhtikuu", "toukokuu", "kesäkuu", "heinäkuu", "elokuu", "syyskuu", "lokakuu", "marraskuu", "joulukuu"],
		monthsShort: ["tam", "hel", "maa", "huh", "tou", "kes", "hei", "elo", "syy", "lok", "mar", "jou"],
		today: "tänään",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * French translation for bootstrap-datetimepicker
 * Nico Mollet <nico.mollet@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['fr'] = {
		days: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
		daysShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
		daysMin: ["D", "L", "Ma", "Me", "J", "V", "S", "D"],
		months: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
		monthsShort: ["Jan", "Fev", "Mar", "Avr", "Mai", "Jui", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"],
		today: "Aujourd'hui",
		suffix: [],
		meridiem: ["am", "pm"],
		weekStart: 1,
		format: "dd/mm/yyyy"
	};
}(jQuery));

/**
 * Hebrew translation for bootstrap-datetimepicker
 * Sagie Maoz <sagie@maoz.info>
 */
;(function($){
  $.fn.datetimepicker.dates['he'] = {
      days: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת", "ראשון"],
      daysShort: ["א", "ב", "ג", "ד", "ה", "ו", "ש", "א"],
      daysMin: ["א", "ב", "ג", "ד", "ה", "ו", "ש", "א"],
      months: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
      monthsShort: ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"],
      today: "היום",
	  suffix: [],
	  meridiem: [],
      rtl: true
  };
}(jQuery));

/**
 * Croatian localisation
 */
;(function($){
	$.fn.datetimepicker.dates['hr'] = {
		days: ["Nedjelja", "Ponedjelja", "Utorak", "Srijeda", "Četrtak", "Petak", "Subota", "Nedjelja"],
		daysShort: ["Ned", "Pon", "Uto", "Srr", "Čet", "Pet", "Sub", "Ned"],
		daysMin: ["Ne", "Po", "Ut", "Sr", "Če", "Pe", "Su", "Ne"],
		months: ["Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj", "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac"],
		monthsShort: ["Sije", "Velj", "Ožu", "Tra", "Svi", "Lip", "Jul", "Kol", "Ruj", "Lis", "Stu", "Pro"],
		today: "Danas",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Hungarian translation for bootstrap-datetimepicker
 * darevish <http://github.com/darevish>
 */
;(function($){
	$.fn.datetimepicker.dates['hu'] = {
		days: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"],
		daysShort: ["Vas", "Hét", "Ked", "Sze", "Csü", "Pén", "Szo", "Vas"],
		daysMin: ["V", "H", "K", "Sze", "Cs", "P", "Szo", "V"],
		months: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
		monthsShort: ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Sze", "Okt", "Nov", "Dec"],
		today: "Ma",
		suffix: [],
		meridiem: [],
		weekStart: 1
	};
}(jQuery));

/**
 * Bahasa translation for bootstrap-datetimepicker
 * Azwar Akbar <azwar.akbar@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['id'] = {
		days: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
		daysShort: ["Mgu", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Mgu"],
		daysMin: ["Mg", "Sn", "Sl", "Ra", "Ka", "Ju", "Sa", "Mg"],
		months: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"],
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Icelandic translation for bootstrap-datetimepicker
 * Hinrik Örn Sigurðsson <hinrik.sig@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['is'] = {
		days: ["Sunnudagur", "Mánudagur", "Þriðjudagur", "Miðvikudagur", "Fimmtudagur", "Föstudagur", "Laugardagur", "Sunnudagur"],
		daysShort: ["Sun", "Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"],
		daysMin: ["Su", "Má", "Þr", "Mi", "Fi", "Fö", "La", "Su"],
		months: ["Janúar", "Febrúar", "Mars", "Apríl", "Maí", "Júní", "Júlí", "Ágúst", "September", "Október", "Nóvember", "Desember"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Maí", "Jún", "Júl", "Ágú", "Sep", "Okt", "Nóv", "Des"],
		today: "Í Dag",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Italian translation for bootstrap-datetimepicker
 * Enrico Rubboli <rubboli@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['it'] = {
		days: ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"],
		daysShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
		daysMin: ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"],
		months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
		monthsShort: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
		today: "Oggi",
		suffix: [],
		meridiem: [],
		weekStart: 1,
		format: "dd/mm/yyyy hh:ii:ss"
	};
}(jQuery));

/**
 * Japanese translation for bootstrap-datetimepicker
 * Norio Suzuki <https://github.com/suzuki/>
 */
;(function($){
	$.fn.datetimepicker.dates['ja'] = {
		days: ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜", "日曜"],
		daysShort: ["日", "月", "火", "水", "木", "金", "土", "日"],
		daysMin: ["日", "月", "火", "水", "木", "金", "土", "日"],
		months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
		today: "今日",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Korean translation for bootstrap-datetimepicker
 * Gu Youn <http://github.com/guyoun>
 * Baekjoon Choi <http://github.com/Baekjoon>
 */
;(function($){
	$.fn.datetimepicker.dates['ko'] = {
		days: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"],
		daysShort: ["일", "월", "화", "수", "목", "금", "토", "일"],
		daysMin: ["일", "월", "화", "수", "목", "금", "토", "일"],
		months: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
		monthsShort: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
		suffix: [],
		meridiem: ["오전", "오후"],
        today: "오늘",
	};
}(jQuery));

/**
 * Lithuanian translation for bootstrap-datetimepicker
 * Šarūnas Gliebus <ssharunas@yahoo.co.uk>
 */

;(function($){
    $.fn.datetimepicker.dates['lt'] = {
        days: ["Sekmadienis", "Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis", "Sekmadienis"],
        daysShort: ["S", "Pr", "A", "T", "K", "Pn", "Š", "S"],
        daysMin: ["Sk", "Pr", "An", "Tr", "Ke", "Pn", "Št", "Sk"],
        months: ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"],
        monthsShort: ["Sau", "Vas", "Kov", "Bal", "Geg", "Bir", "Lie", "Rugp", "Rugs", "Spa", "Lap", "Gru"],
        today: "Šiandien",
		suffix: [],
		meridiem: [],
        weekStart: 1
    };
}(jQuery));

/**
 * Latvian translation for bootstrap-datetimepicker
 * Artis Avotins <artis@apit.lv>
 */

;(function($){
    $.fn.datetimepicker.dates['lv'] = {
        days: ["Svētdiena", "Pirmdiena", "Otrdiena", "Trešdiena", "Ceturtdiena", "Piektdiena", "Sestdiena", "Svētdiena"],
        daysShort: ["Sv", "P", "O", "T", "C", "Pk", "S", "Sv"],
        daysMin: ["Sv", "Pr", "Ot", "Tr", "Ce", "Pk", "St", "Sv"],
        months: ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jūn", "Jūl", "Aug", "Sep", "Okt", "Nov", "Dec."],
        today: "Šodien",
		suffix: [],
		meridiem: [],
        weekStart: 1
    };
}(jQuery));
/**
 * Malay translation for bootstrap-datetimepicker
 * Ateman Faiz <noorulfaiz@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['ms'] = {
		days: ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu", "Ahad"],
		daysShort: ["Aha", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Aha"],
		daysMin: ["Ah", "Is", "Se", "Ra", "Kh", "Ju", "Sa", "Ah"],
		months: ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"],
		today: "Hari Ini",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Norwegian (bokmål) translation for bootstrap-datetimepicker
 * Fredrik Sundmyhr <http://github.com/fsundmyhr>
 */
;(function($){
	$.fn.datetimepicker.dates['nb'] = {
		days: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"],
		daysShort: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"],
		daysMin: ["Sø", "Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"],
		months: ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"],
		today: "I Dag",
		suffix: [],
		meridiem: []
	};
}(jQuery));
/**
 * Dutch translation for bootstrap-datetimepicker
 * Reinier Goltstein <mrgoltstein@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['nl'] = {
		days: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"],
		daysShort: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
		daysMin: ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
		months: ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"],
		monthsShort: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
		today: "Vandaag",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Norwegian translation for bootstrap-datetimepicker
 * Rune Warhuus <rune@dinkdonkd.no>
 */
;(function($){
	$.fn.datetimepicker.dates['no'] = {
		days: ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"],
		daysShort: ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"],
		daysMin: ["Sø", "Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"],
		months: ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"],
		today: "I Dag",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Polish translation for bootstrap-datetimepicker
 * Robert <rtpm@gazeta.pl>
 */
;(function($){
$.fn.datetimepicker.dates['pl'] = {
        days: ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"],
        daysShort: ["Nie", "Pn", "Wt", "Śr", "Czw", "Pt", "So", "Nie"],
        daysMin: ["N", "Pn", "Wt", "Śr", "Cz", "Pt", "So", "N"],
        months: ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
        monthsShort: ["Sty", "Lu", "Mar", "Kw", "Maj", "Cze", "Lip", "Sie", "Wrz", "Pa", "Lis", "Gru"],
        today: "Dzisiaj",
		suffix: [],
		meridiem: [],
        weekStart: 1
};
}(jQuery));

/**
 * Brazilian translation for bootstrap-datetimepicker
 * Cauan Cabral <cauan@radig.com.br>
 */
;(function($){
	$.fn.datetimepicker.dates['pt-BR'] = {
        format: 'dd/mm/yyyy',
		days: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
		daysShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
		daysMin: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa", "Do"],
		months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
		monthsShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
		today: "Hoje",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Portuguese translation for bootstrap-datetimepicker
 * Original code: Cauan Cabral <cauan@radig.com.br>
 * Tiago Melo <tiago.blackcode@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['pt'] = {
		days: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
		daysShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
		daysMin: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa", "Do"],
		months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
		monthsShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
		suffix: [],
		meridiem: ["am","pm"],
		today: "Hoje"
	};
}(jQuery));

/**
 * Romanian translation for bootstrap-datetimepicker
 * Cristian Vasile <cristi.mie@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['ro'] = {
		days: ["Duminică", "Luni", "Marţi", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
		daysShort: ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"],
		daysMin: ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"],
		months: ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"],
		monthsShort: ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		today: "Astăzi",
		suffix: [],
		meridiem: [],
		weekStart: 1
	};
}(jQuery));

/**
 * Serbian latin translation for bootstrap-datetimepicker
 * Bojan Milosavlević <milboj@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['rs'] = {
		days: ["Nedelja","Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"],
		daysShort: ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"],
		daysMin: ["N", "Po", "U", "Sr", "Č", "Pe", "Su", "N"],
		months: ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"],
		today: "Danas",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Serbian cyrillic translation for bootstrap-datetimepicker
 * Bojan Milosavlević <milboj@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['rs'] = {
		days: ["Недеља","Понедељак", "Уторак", "Среда", "Четвртак", "Петак", "Субота", "Недеља"],
		daysShort: ["Нед", "Пон", "Уто", "Сре", "Чет", "Пет", "Суб", "Нед"],
		daysMin: ["Н", "По", "У", "Ср", "Ч", "Пе", "Су", "Н"],
		months: ["Јануар", "Фебруар", "Март", "Април", "Мај", "Јун", "Јул", "Август", "Септембар", "Октобар", "Новембар", "Децембар"],
		monthsShort: ["Јан", "Феб", "Мар", "Апр", "Мај", "Јун", "Јул", "Авг", "Сеп", "Окт", "Нов", "Дец"],
		today: "Данас",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Russian translation for bootstrap-datetimepicker
 * Victor Taranenko <darwin@snowdale.com>
 */
;(function($){
	$.fn.datetimepicker.dates['ru'] = {
		days: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
		daysShort: ["Вск", "Пнд", "Втр", "Срд", "Чтв", "Птн", "Суб", "Вск"],
		daysMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
		months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
		monthsShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
		today: "Сегодня",
		suffix: [],
		meridiem: []
	};
}(jQuery));
/**
 * Slovak translation for bootstrap-datetimepicker
 * Marek Lichtner <marek@licht.sk>
 * Fixes by Michal Remiš <michal.remis@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates["sk"] = {
		days: ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"],
		daysShort: ["Ned", "Pon", "Uto", "Str", "Štv", "Pia", "Sob", "Ned"],
		daysMin: ["Ne", "Po", "Ut", "St", "Št", "Pia", "So", "Ne"],
		months: ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Máj", "Jún", "Júl", "Aug", "Sep", "Okt", "Nov", "Dec"],
		today: "Dnes",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Slovene translation for bootstrap-datetimepicker
 * Gregor Rudolf <gregor.rudolf@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['sl'] = {
		days: ["Nedelja", "Ponedeljek", "Torek", "Sreda", "Četrtek", "Petek", "Sobota", "Nedelja"],
		daysShort: ["Ned", "Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"],
		daysMin: ["Ne", "Po", "To", "Sr", "Če", "Pe", "So", "Ne"],
		months: ["Januar", "Februar", "Marec", "April", "Maj", "Junij", "Julij", "Avgust", "September", "Oktober", "November", "December"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"],
		today: "Danes",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Swedish translation for bootstrap-datetimepicker
 * Patrik Ragnarsson <patrik@starkast.net>
 */
;(function($){
	$.fn.datetimepicker.dates['sv'] = {
		days: ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"],
		daysShort: ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
		daysMin: ["Sö", "Må", "Ti", "On", "To", "Fr", "Lö", "Sö"],
		months: ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"],
		monthsShort: ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"],
		today: "I Dag",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Swahili translation for bootstrap-datetimepicker
 * Edwin Mugendi <https://github.com/edwinmugendi>
 * Source: http://scriptsource.org/cms/scripts/page.php?item_id=entry_detail&uid=xnfaqyzcku
 */
;(function($){
    $.fn.datetimepicker.dates['sw'] = {
        days: ["Jumapili", "Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi", "Jumapili"],
        daysShort: ["J2", "J3", "J4", "J5", "Alh", "Ij", "J1", "J2"],
        daysMin: ["2", "3", "4", "5", "A", "I", "1", "2"],
        months: ["Januari", "Februari", "Machi", "Aprili", "Mei", "Juni", "Julai", "Agosti", "Septemba", "Oktoba", "Novemba", "Desemba"],
        monthsShort: ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ago", "Sep", "Okt", "Nov", "Des"],
        today: "Leo",
		suffix: [],
		meridiem: []
    };
}(jQuery));

/**
 * Thai translation for bootstrap-datetimepicker
 * Suchau Jiraprapot <seroz24@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['th'] = {
		days: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์", "อาทิตย์"],
		daysShort: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"],
		daysMin: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"],
		months: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
		monthsShort: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
		today: "วันนี้",
		suffix: [],
		meridiem: []
	};
}(jQuery));

/**
 * Turkish translation for bootstrap-datetimepicker
 * Serkan Algur <kaisercrazy_2@hotmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['tr'] = {
		days: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
		daysShort: ["Pz", "Pzt", "Sal", "Çrş", "Prş", "Cu", "Cts", "Pz"],
		daysMin: ["Pz", "Pzt", "Sa", "Çr", "Pr", "Cu", "Ct", "Pz"],
		months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
		monthsShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
		today: "Bugün",
		suffix: [],
		meridiem: []
	};
}(jQuery));


/**
 * Ukrainian translation for bootstrap-datepicker
 * Igor Polynets
 */
;(function($){
	$.fn.datetimepicker.dates['ua'] = {
		days: ["Неділя", "Понеділок", "Вівторок", "Середа", "Четверг", "П'ятниця", "Субота", "Неділя"],
		daysShort: ["Нед", "Пнд", "Втр", "Срд", "Чтв", "Птн", "Суб", "Нед"],
		daysMin: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
		months: ["Cічень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"],
		monthsShort: ["Січ", "Лют", "Бер", "Квт", "Трв", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Грд"],
		today: "Сьогодні",
		weekStart: 1
	};
}(jQuery));

/**
 * Ukrainian translation for bootstrap-datetimepicker
 * Andrey Vityuk <andrey [dot] vityuk [at] gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['uk'] = {
		days: ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота", "Неділя"],
		daysShort: ["Нед", "Пнд", "Втр", "Срд", "Чтв", "Птн", "Суб", "Нед"],
		daysMin: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
		months: ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"],
		monthsShort: ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"],
		today: "Сьогодні",
		suffix: [],
		meridiem: []
	};
}(jQuery));
/**
 * Simplified Chinese translation for bootstrap-datetimepicker
 * Yuan Cheung <advanimal@gmail.com>
 */
;(function($){
	$.fn.datetimepicker.dates['zh-CN'] = {
			days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
			daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
			daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
			months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			today: "今天",
			suffix: [],
			meridiem: ["上午", "下午"]
	};
}(jQuery));

/**
 * Traditional Chinese translation for bootstrap-datetimepicker
 * Rung-Sheng Jang <daniel@i-trend.co.cc>
 */
;(function($){
	$.fn.datetimepicker.dates['zh-TW'] = {
	days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
	  daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
		daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
		months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		today: "今天",
    suffix: [],
		meridiem: ["上午", "下午"]
	};
}(jQuery));

+ function($) {
    "use strict";
    $.showMessage = function(op) {
        var msgdiv = $('<div class="alert alert-'+op.type+' alert-dismissible"></div>');
        var closebtn = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
        msgdiv.append(closebtn).append(op.msg);
        msgdiv.css({'position':'fixed', 'top':op.pos.top, 'left':op.pos.left, 'bottom':op.pos.bottom, 'right':op.pos.right, 'display':'block'});
        msgdiv.css('z-index',5);
        setTimeout(function() {
          msgdiv.fadeOut('slow');
        }, 3000);

        $(document.body).append(msgdiv);
    }

    $.showMessageDialog = function(op) {

    	var msgdiv = $('<div class="alert alert-'+op.type+' alert-dismissible"></div>');
        var closebtn = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
        var titlediv = $('<h4>'+op.title+'</h4>');
        var contentdiv = $('<p>'+op.msg+'</p>')
        var btndiv;
        if(op.type == 'danger' || op.type == 'warning') {
        	btndiv = $('<div class="alert-dialog-footer"><div class="col-md-6" ><button type="button" data-role="okbtn" data-dismiss="alert" class="btn btn-danger btn-block">确定</button></div><div class="col-md-6"><button type="button" data-dismiss="alert" class="btn btn-default btn-block">取消</button></div></div>');
        } else {
        	btndiv = $('<div class="alert-dialog-footer"><div class="col-md-12" ><button type="button" data-role="okbtn" class="btn btn-primary btn-block ">确定</button></div></div>');
        }

        msgdiv.append(closebtn).append(titlediv).append(contentdiv).append(btndiv);

        msgdiv.find('[data-role="okbtn"]').on('click.alert.global.ok', op.okfn);

        msgdiv.addClass('alert-dialog');
        msgdiv.css('z-index',5);
       
        $(document.body).append(msgdiv);

    }

}(jQuery);
;
(function($, window, document, undefined) {
	/*
	 * 对象所支持的属性及默认值
	 */
	var dataSource = function(options) {
		this.default = {
			pageSize: 20, // 每页显示多少数据
			canChangePageSize:false, // 是否可以修改pageSize
			rowCount:-1, // 总行数
		}
		this.options = $.extend({}, this.default, options);
		this.rows = new Array(); // 存储数据行
		this.sortRows();
		this.pageCount = -1;
		this.showPageBar = false;
		// 计算总计分多少页
		if(!(this.options.rowCount > 0)){
			this.options.rowCount = this.rows.length;
		}
		if(this.options.pageSize > 0){
			this.pageCount = Math.ceil(this.options.rowCount/this.options.pageSize);
		}
		// 判断是否需要显示分页条
		if(this.pageCount > 1 || (this.options.canChangePageSize == true && this.options.rowCount > 10)){
			this.showPageBar = true;
		}
	};
	var gridCompColumn = function(options, gridOptions) {
		this.default = {
				sortable: true, //是否可以排序
				canDrag: true, //是否可以拖动
				fixed: false, //是否固定列
				visible: true // 是否显示
			}
			// 从grid继承的属性
		var gridDefault = {
			sortable: gridOptions.sortable,
			canDrag: gridOptions.canDrag
		}
		this.options = $.extend({}, this.default, gridDefault, options);
	};

	var gridComp = function(ele, options) {
		this.dataSource = dataSource;
		this.gridCompColumn = gridCompColumn;
		this.ele = ele[0];
		this.$ele = ele;

		this.default = {
			id: 'grid',
			width: '100%',
			height: '100%',
			sortable: true, // 是否可以排序
			canDrag: true, //是否可以拖动
			showHeader: true, //是否显示表头
			columnMenu: true, //是否存在列头操作按钮
			showNumCol: false, // 是否显示数字列
			multiSelect:false, // 是否显示复选框
			

			editable: false, // 是否可修改
			showSumRow: false, // 是否显示合计行
		}
		
		this.transDefault = {
			ml_show_column:'显示/隐藏列',
			ml_clear_set:'清除设置'
		}
		
		this.transMap = $.extend({},this.transDefault,options.transMap);

		this.options = $.extend({}, this.default, options);

		this.gridCompColumnArr = new Array(); // 存储设置默认值之后的columns对象
		this.basicGridCompColumnArr = new Array(); // 存储基本的columns对象，用于清除设置
		// 鼠标点击移动时位置记录
		this.mouseUpX = 'mouseUpX';
		this.mouseUpY = 'mouseUpY';
		this.mouseDownX = 'mouseDownX';
		this.mouseDownY = 'mouseDownY';
		this.mouseMoveX = 'mouseMoveX';
		this.mouseMoveY = 'mouseMoveY';
		this.scrollLeft = 0; // 记录横向滚动条
		this.showType = ''; // 记录grid显示方式，form和grid
		this.createGridFlag = false; //是否已经创建grid展示
		this.createFormFlag = false; //是否已经创建form展示
		this.multiSelectWidth = 40; // 复选框列宽度
		this.numWidth = 40; // 数字列宽度
		this.multiWidth = 40;//复选框宽度
		this.leftW = 0; // 左侧区域宽度（数字列复选框等）
		this.wholeWidth = 0; // 整体宽度
		this.wholeHeight = 0; // 整体高度
		this.headerHeight = 35; // header区域高度
		this.pageBarHeight = 50; // 分页标签的高度
		this.exceptContentHeight = 0; // 内容区域之外的高度
		this.minColumnWidth = 80; // 最小列宽
		this.columnMenuWidth = 160; //column menu的宽度
		this.$sd_storageData = null;// 本地缓存内容为object
		this.columnMenuMove = false;// 是否在column menu区域移动
		this.createColumnMenuFlage = false;
		this.initGrid();
	};


	/*
	 * 对象提供的方法
	 */
	gridComp.prototype = {
		/*
		 * 创建grid
		 */
		initGrid: function() {
			this.initGridCompColumn();
			this.initDataSource();
			this.initOptions();
			this.createDivs();
			setInterval(this.setIntervalFun.bind(this), 100);
		},

		/*
		 * 对传入参数进行格式化处理
		 * 宽度、高度处理
		 * 左侧区域宽度计算
		 * 除去内容区域的高度
		 */
		initOptions: function() {
			this.options.width = this.formatWidth(this.options.width);
			this.options.height = this.formatWidth(this.options.height);
			if (this.options.showNumCol) {
				this.leftW += this.numWidth;
			}
			if(this.options.multiSelect){
				this.leftW += this.multiWidth;
			}
			if(this.options.showHeader){
				this.exceptContentHeight +=this.headerHeight;
			}
			if(this.dataSourceObj.showPageBar){
				this.exceptContentHeight +=this.pageBarHeight;
			}
		},

		/*
		 * 创建gridCompColumn对象方便后续处理
		 */
		initGridCompColumn: function() {
			var oThis = this;
			if (this.options.columns) {
				$.each(this.options.columns, function(i) {
					var column = new gridCompColumn(this, oThis.options);
					oThis.gridCompColumnArr[i] = column;
					var column1 = new gridCompColumn(this, oThis.options);
					oThis.basicGridCompColumnArr[i] = column1;
				});
			}
			var localGridCompColumnArr = this.getGridCompColumnArrFromLocal();
			// 获取本地缓存中的数据
			if(localGridCompColumnArr != null){
				this.gridCompColumnArr = localGridCompColumnArr;
			}
		},

		/*
		 * 创建dataSource对象方便后续处理
		 */
		initDataSource: function() {
			var oThis = this;
			if (this.options.dataSource) {
				this.dataSourceObj = new dataSource(this.options.dataSource);
			}
		},

		/*
		 * 创建div区域
		 */
		createDivs: function() {
			var oThis = this;
			// 创建顶层div
			var htmlStr = '<div id="' + this.options.id + '" data-role="grid" class="ufida-grid" style="width:' + this.options.width + ';height:' + this.options.height + '">';
			htmlStr += '</div>';
			this.ele.insertAdjacentHTML('afterBegin', htmlStr);
			// 创建屏幕div,用于拖动等操作
			var htmlStr = '<div id="' + this.options.id + '_top" class="ufida-grid-top"></div>';
			window.top.document.body.insertAdjacentHTML('afterBegin', htmlStr);
			
			this.initEventFun(); //创建完成之后顶层div添加监听
			this.widthChangeFunc(); // 根据整体宽度创建grid或form展示区域
		},

		/*
		 * 创建grid形式下div区域
		 */
		createGridDivs: function() {
			if (this.createGridFlag) {
				return;
			}
			var htmlStr = '<div id="' + this.options.id + '_grid" class="ufida-grid-grid">';
			if(this.options.showHeader){
				htmlStr += this.createColumnMenu();
				htmlStr += this.createHeader();
			}
			htmlStr += this.createContent();
			if(this.dataSourceObj.showPageBar){
				htmlStr += this.createPageBar();
			}
			htmlStr += '</div>';
			$('#' + this.options.id)[0].insertAdjacentHTML('afterBegin', htmlStr);
			
			this.headerFirstClassFun();
			this.initGridEventFun();
			this.afterGridDivsCreate();
			this.createGridFlag = true;
		},
		/*
		 * 重画grid
		 */
		repaintGridDivs: function() {
			$('#' + this.options.id + '_grid').remove();
			this.createGridFlag = false;
			this.createGridDivs();
			this.countWidth();
			$('#' + this.options.id + '_content')[0].scrollLeft = this.scrollLeft;
		},
		
		/*
		 * 创建columnMenu区域
		 */
		createColumnMenu: function() {
			var htmlStr = '<div class="ufida-grid-column-menu" id="' + this.options.id + '_column_menu">';
			htmlStr += '<ul data-role="menu" role="menubar" class="ufida-grid-column-menu-ul" id="' + this.options.id + '_column_menu_ul">';

			// 创建显示/隐藏列
			htmlStr += '<li class="ufida-grid-column-menu-li" role="menuitem">';
			htmlStr += '<div class="ufida-grid-column-menu-div1" id="' + this.options.id + '_showColumn">';
//			htmlStr += '<div class="ufida-grid-column-menu-div2 fa fa-columns"></div>'; 
			htmlStr += '<span class="ufida-grid-column-menu-span">' + this.transMap.ml_show_column + '</span>';
			htmlStr += '<div class="ufida-grid-column-menu-div3 fa fa-caret-right"></div>';
			htmlStr += '</div></li>';
			
			// 创建清除设置
			htmlStr += '<li class="ufida-grid-column-menu-li" role="menuitem">';
			htmlStr += '<div class="ufida-grid-column-menu-div1" id="' + this.options.id + '_clearSet">';
			//htmlStr += '<div class="ufida-grid-column-menu-div2 fa fa-columns"></div>';
			htmlStr += '<span class="ufida-grid-column-menu-span">' + this.transMap.ml_clear_set + '</span>';
			htmlStr += '</div></li>';
			
			htmlStr += '</ul></div>';
			
			// 创建数据列区域
			htmlStr += '<div class="ufida-grid-column-menu" id="' + this.options.id + '_column_menu_columns">';
			htmlStr += '<ul data-role="menu" role="menubar" class="ufida-grid-column-menu-columns-ul" id="' + this.options.id + '_column_menu_columns_ul">';
			$.each(this.gridCompColumnArr, function(i) {
				htmlStr += '<li class="ufida-grid-column-menu-columns-li" role="menuitem" index="' + i + '">';
				htmlStr += '<div class="ufida-grid-column-menu-columns-div1">';
				var checkedStr = "";
				if(this.options.visible)
					checkedStr = 'checked';
				htmlStr += '<div class="ufida-grid-column-menu-columns-div2"><input type="checkbox" ' + checkedStr + '></div>';
				htmlStr += '<span class="ufida-grid-column-menu-columns-span">' + this.options.title + '</span>';
				htmlStr += '</div></li>';
			});
			htmlStr += '</ul></div>';
			return htmlStr;
		},

		/*
		 * 创建header区域
		 */
		createHeader: function() {
			var htmlStr = '<div class="ufida-grid-header" id="' + this.options.id + '_header"><div class="ufida-grid-header-wrap" id="' + this.options.id + '_header_wrap" data-role="resizable">';
			if (this.options.multiSelect || this.options.showNumCol) {
				htmlStr += '<div style="width:' + this.leftW + 'px;position:absolute;">';
				if (this.options.multiSelect) {
					htmlStr += '<div class="ufida-grid-header-multi-select" style="width:' + this.multiWidth + 'px;"><input type="checkbox" id="' + this.options.id + '_header_multi_input"></div>'
				}
				if (this.options.showNumCol) {
					htmlStr += '<div class="ufida-grid-header-num" style="width:' + this.numWidth + 'px;"></div>'
				}
			}
			htmlStr += '</div>';
			htmlStr += '<table role="grid" id="' + this.options.id + '_header_table" style="position:relative;left:' + this.leftW + 'px">';
			htmlStr += this.createColgroup();
			htmlStr += '<thead role="rowgroup" id="' + this.options.id + '_header_thead">';
			htmlStr += this.createThead();
			htmlStr += '</thead></table></div>';
			htmlStr += '<div class="ufida-grid-header-resize-handle" id="' + this.options.id + '_resize_handle"><div class="ufida-grid-header-resize-handle-inner"></div></div>';
			htmlStr += '</div>';
			return htmlStr;
		},
		
		/*
		 * 创建colgroup
		 */
		createColgroup: function(type) {
			var oThis = this,
				htmlStr = '<colgroup>';
			$.each(this.gridCompColumnArr, function() {
				htmlStr += '<col';
				if (this.options.width) {
					htmlStr += ' style="width:' + oThis.formatWidth(this.options.width) + '"';
				}
				htmlStr += '>';
			});
			htmlStr += '</colgroup>';
			return htmlStr;
		},
		
		/*
		 * 创建thead区域
		 */
		createThead: function() {
			var oThis = this;
			var htmlStr = '<tr role="row">';
			var visibleIndex = 0;
			$.each(this.gridCompColumnArr, function(i) {
				var vi = visibleIndex;
				if(this.options.visible == false){
					vi = -1;
				}else{
					visibleIndex++;
				}
				htmlStr += '<th role="columnheader" data-filed="' + this.options.field + '" rowspan="1" class="ufida-grid-header-th" field="' + this.options.field + '" index="' + i + '" visibleIndex="' + vi + '">';
				htmlStr += '<div class="ufida-grid-header-link" field="' + this.options.field + '" title="' + this.options.title + '">' + this.options.title + '</div>';
				if(oThis.options.columnMenu){
					htmlStr += '<div class="ufida-grid-header-columnmenu fa fa-bars " field="' + this.options.field + '"></div>';
				}
				htmlStr += '</th>';
			});
			htmlStr += '</tr>';

			return htmlStr;
		},
		/*
		 * 创建内容区域
		 */
		createContent: function() {
			var h = '',
				wh = $('#' + this.options.id)[0].offsetHeight;
			this.wholeHeight = wh;
			if (wh > 0) {
				var hh = parseInt(wh) - this.exceptContentHeight > 0?parseInt(wh) - this.exceptContentHeight:0;
				h = 'style="height:' + hh + 'px"';
			}
			var htmlStr = '<div id="' + this.options.id + '_content" class="ufida-grid-content" ' + h + '>';
			if (this.options.showNumCol || this.options.multiSelect) {
				htmlStr += '<div class="ufida-grid-content-left" style="width:' + this.leftW + 'px">';
				htmlStr += this.createContentLeft();
				htmlStr += '</div>';
			}
			htmlStr += '<table role="grid" id="' + this.options.id + '_content_table" style="position:relative;left:' + this.leftW + 'px">';
			htmlStr += this.createColgroup();
			htmlStr += '<thead role="rowgroup" id="' + this.options.id + '_content_thead" style="display:none">';
			htmlStr += this.createThead();
			htmlStr += '</thead>';
			htmlStr += this.createContentRows();
			htmlStr += '</table>';
			htmlStr += '</div>';
			return htmlStr;
		},

		/*
		 * 创建内容区左侧区域
		 */
		createContentLeft: function() {
			var oThis = this,
				htmlStr = "";
			// 遍历生成所有行
			if (this.dataSourceObj.rows) {
				$.each(this.dataSourceObj.rows, function(i) {
					htmlStr += '<div style="width:' + oThis.leftW + 'px;position:relative;">';
					if(oThis.options.multiSelect){
						htmlStr += '<div style="width:' + oThis.multiSelectWidth + 'px" class="ufida-grid-content-multiSelect"><input type="checkbox" index="' + i + '"></div>'
					}
					if (oThis.options.showNumCol) {
						htmlStr += '<div style="width:' + oThis.numWidth + 'px" class="ufida-grid-content-num">' + i + '</div>'
					}
					htmlStr += '</div>';
				});
			}
			return htmlStr;
		},

		/*
		 * 创建内容区域所有行
		 */
		createContentRows: function() {
			var oThis = this,
				htmlStr = "";
			// 遍历生成所有行
			if (this.dataSourceObj.rows) {
				htmlStr += '<tbody role="rowgroup" id="' + this.options.id + '_content_tbody">';
				$.each(this.dataSourceObj.rows, function(i) {
					htmlStr += '<tr role="row">';
					var value = this;
					$.each(oThis.gridCompColumnArr, function() {
						var f = this.options.field,
							v = $(value).attr(f);
						htmlStr += '<td role="rowcell" title="' + v + '">' + v + '</td>';
					});
					htmlStr += '</tr>';
				});
				htmlStr += '</tbody>';
			}
			return htmlStr;
		},

		/*
		 * 重画数据区域
		 */
		rePairContentRows: function() {
			var $pDiv = $('#' + this.options.id + '_content_tbody').parent();
			$('#' + this.options.id + '_content_tbody').remove();
			var htmlStr = this.createContentRows();
			$pDiv[0].insertAdjacentHTML('afterBegin', htmlStr);
		},
		/*
		 * 创建分页标签
		 */
		createPageBar:function(){
			var htmlStr = '<div id="' + this.options.id + '_pagebar" class="ufida-grid-pagebar">';
//			htmlStr += '<div id="' + this.options.id + '_page_first" class="ufida-grid-pagebar-div fa fa-angle-double-left"></div>';
//			htmlStr += '<div id="' + this.options.id + '_page_before" class="ufida-grid-pagebar-div fa fa-angle-left"></div>';
//			var pageCount = this.dataSourceObj.pageCount;
//			if(pageCount <= 8){
//				for(var i = 0;i<pageCount;i++){
//					htmlStr += '<div class="ufida-grid-pagebar-div" pageIndex="' + i + '">' + (i+1) + '</div>';
//				}
//			}
//			htmlStr += '<div id="' + this.options.id + '_page_next" class="ufida-grid-pagebar-div fa fa-angle-right"></div>';
//			htmlStr += '<div id="' + this.options.id + '_page_last" class="ufida-grid-pagebar-div fa fa-angle-double-right"></div>';
			htmlStr += '</div>';
			return htmlStr;
		},
		/*
		 * 创建form形式下div
		 */
		createFromDivs: function() {
			if (this.createFormFlag) {
				return;
			}
			var htmlStr = '<div id="' + this.options.id + '_form" class="ufida-grid-form">';
			htmlStr += this.createFromContent();
			$('#' + this.options.id)[0].insertAdjacentHTML('afterBegin', htmlStr);
			this.createFormFlag = true;
		},

		/*
		 * 创建form形式下内容区域
		 */
		createFromContent: function() {
			var htmlStr = '<div class="ufida-grid-form-content" id="' + this.options.id + '_form_content" class="ufida-grid-content">';
			htmlStr += '<table role="grid" id="' + this.options.id + '_form_content_table">';
			htmlStr += this.createFormContentRows();
			htmlStr += '</table>';
			return htmlStr;
		},

		/*
		 * 创建form形式下内容区域所有行
		 */
		createFormContentRows: function() {
			var oThis = this,
				htmlStr = "";
			// 遍历生成所有行
			if (this.dataSourceObj.rows) {
				htmlStr += '<tbody role="rowgroup" id="' + this.options.id + '_form_content_tbody">';
				$.each(this.dataSourceObj.rows, function() {
					htmlStr += '<tr role="row"><td role="rowcell">';
					var value = this;
					$.each(oThis.gridCompColumnArr, function() {
						var f = this.options.field,
							t = this.options.title,
							v = $(value).attr(f);
						htmlStr += '<div>' + t + ':</div>';
						htmlStr += '<div>' + v + '</div>';
					});
					htmlStr += '</td></tr>';
				});
				htmlStr += '</tbody>';
			}
			return htmlStr;
		},
		
		/*
		 * 创建完成之后顶层div添加监听
		 */
		initEventFun: function() {
			var oThis = this;
			$('#' + this.options.id).on('mousedown', function(e) {
				if ($(e.target).closest('#' + oThis.options.id + '_header').length > 0) {
					// 点击的是header区域
					oThis.mouseDownX = e.clientX;
					oThis.mouseDownY = e.clientY;
					var eleTh = $(e.target).closest('th')[0];
					oThis.swapColumnStart(e, eleTh);
				} else if ($(e.target).closest('#' + oThis.options.id + '_content').length > 0) {
					// 点击的是数据区域
				}
				return false;
			});
			$('#' + this.options.id).on('mousemove', function(e) {
				if (!oThis.countWidthFlag) {
					oThis.countWidth(e); //某些情况下不是创建完就显示的，所以在mousemove中处理
					oThis.countWidthFlag = true;
				}
				if ($(e.target).closest('#' + oThis.options.id + '_header').length > 0) {
					// 在header区域移动
					var eleTh = $(e.target).closest('th')[0];
					oThis.headerThDrag(e, eleTh);
				}
				oThis.mouseMoveX = e.clientX;
				oThis.mouseMoveY = e.clientY;
				if ((oThis.mouseMoveX != oThis.mouseDownX || oThis.mouseDownY != oThis.mouseMoveY) && oThis.mouseDownX != 'mouseDownX') {
					// 鼠标按下之后移动了
					oThis.swapColumnFlag = true;
				}
				oThis.dragFun(e);
				oThis.swapColumnFun(e);
				return false;
			});
			$('#' + this.options.id + '_top').on('mousemove', function(e) {
				oThis.mouseMoveX = e.clientX;
				oThis.mouseMoveY = e.clientY;
				if ((oThis.mouseMoveX != oThis.mouseDownX || oThis.mouseDownY != oThis.mouseMoveY) && oThis.mouseDownX != 'mouseDownX') {
					// 鼠标按下之后移动了
					oThis.swapColumnFlag = true;
				}
				oThis.dragFun(e);
				oThis.swapColumnFun(e);
				return false;
			});
			$('#' + this.options.id).on('mouseup', function(e) {
				if ($(e.target).closest('#' + oThis.options.id + '_header').length > 0) {
					// 点击的是header区域
					oThis.mouseUpX = e.clientX;
					oThis.mouseUpY = e.clientY;
					//点击过程中鼠标没有移动 
					if (oThis.mouseDownX == oThis.mouseUpX && oThis.mouseDownY == oThis.mouseUpY) {
					//或者移动距离小于5px(由于移动之后会显示屏幕div，暂时不做处理)
//					if( Math.abs(parseInt(oThis.mouseDownX) - parseInt(oThis.mouseUpX)) <=5 && Math.abs(parseInt(oThis.mouseDownY) - parseInt(oThis.mouseUpY)) <=5){
						var eleTh = $(e.target).closest('th')[0];
						if($(e.target).hasClass('ufida-grid-header-columnmenu')){
							//点击的是columnmenu
							//待完善 考虑屏幕高度决定columnMenu显示形式
							$('#' + oThis.options.id + '_column_menu').css('display','block');
							$('#' + oThis.options.id + '_column_menu').css('left',eleTh.attrRightTotalWidth - oThis.scrollLeft + oThis.leftW -oThis.columnMenuWidth + 1);
							$('#' + oThis.options.id + '_column_menu').css('top',oThis.headerHeight);
							oThis.createColumnMenuFlage = true;
						}else{
							// 执行click操作,进行排序
							oThis.canSortable(e, eleTh);
						}
					}
				} else if ($(e.target).closest('#' + oThis.options.id + '_content').length > 0) {
					// 点击的是数据区域

				}
				oThis.dragEnd(e);
				oThis.swapColumnEnd(e);
				oThis.mouseUpX = 'mouseUpX';
				oThis.mouseUpY = 'mouseUpY';
				oThis.mouseDownX = 'mouseDownX';
				oThis.mouseDownY = 'mouseDownY';
				oThis.mouseMoveX = 'mouseMoveX';
				oThis.mouseMoveY = 'mouseMoveY';
				return false;
			});
			$('#' + this.options.id+ '_top').on('mouseup', function(e) {
				oThis.dragEnd(e);
				oThis.swapColumnEnd(e);
				oThis.mouseUpX = 'mouseUpX';
				oThis.mouseUpY = 'mouseUpY';
				oThis.mouseDownX = 'mouseDownX';
				oThis.mouseDownY = 'mouseDownY';
				oThis.mouseMoveX = 'mouseMoveX';
				oThis.mouseMoveY = 'mouseMoveY';
				return false;
			});
			document.onclick = function(){
				if(oThis.columnMenuMove == false && oThis.createColumnMenuFlage == false){
					$('#' + oThis.options.id + '_column_menu').css('display','none');
				}
				oThis.createColumnMenuFlage = false;
				return true;
			}
		},

		/*
		 * 创建完成之后grid层 div添加监听
		 */
		initGridEventFun: function() {
			var oThis = this;
			$('#' + this.options.id + '_resize_handle').on('mousedown', function(e) {
				oThis.dragStart(e);
				return false;
			});
			$('#' + this.options.id + '_content').on('scroll', function(e) {
				oThis.scrollLeft = this.scrollLeft;
				$('#' + oThis.options.id + '_header_table').css('left', oThis.leftW - oThis.scrollLeft + "px");
			});
			
			$('#' + this.options.id + '_header_multi_input').on('click', function(e) {
				if(this.checked){
					$('#' + oThis.options.id + '_content .ufida-grid-content-left input').each(function(){
						this.checked = true;
					});
				}else{
					$('#' + oThis.options.id + '_content .ufida-grid-content-left input').each(function(){
						this.checked = false;
					});
				}
			});
			
			
			
			$('#' + this.options.id + '_column_menu_ul').on('mousemove', function(e) {
				oThis.columnMenuMove = true;
			});
			$('#' + this.options.id + '_column_menu_ul').on('mouseout', function(e) {
				oThis.columnMenuMove = false;
			});
			
			// 显示/隐藏列按钮
			$('#' + this.options.id + '_showColumn').on('mousemove', function(e) {
				$('#' + oThis.options.id + '_column_menu_columns').css('display','block');
				var l = $('#' + oThis.options.id + '_column_menu').css('left');
				$('#' + oThis.options.id + '_column_menu_columns').css('left',parseInt(l) + oThis.columnMenuWidth);
				$('#' + oThis.options.id + '_column_menu_columns').css('top',oThis.headerHeight);
				oThis.columnMenuMove = true;
			});
			$('#' + this.options.id + '_showColumn').on('mouseout', function(e) {
				$('#' + oThis.options.id + '_column_menu_columns').css('display','none');
			});
			$('#' + this.options.id + '_column_menu_columns').on('mousemove', function(e) {
				$('#' + oThis.options.id + '_column_menu_columns').css('display','block');
				oThis.columnMenuMove = true;
			});
			$('#' + this.options.id + '_column_menu_columns').on('mouseout', function(e) {
				$('#' + oThis.options.id + '_column_menu_columns').css('display','none');
				oThis.columnMenuMove = false;
			});
			
			// 清除设置按钮
			$('#' + this.options.id + '_clearSet').on('click', function(e) {
				oThis.clearLocalData();
				oThis.gridCompColumnArr = oThis.cloneObj(oThis.basicGridCompColumnArr);
				oThis.repaintGridDivs();
			});
			$('#' + this.options.id + '_column_menu_columns_ul li input').on('click', function(e) {
				//待完善 优化与li的click的代码整合
				var index = $(this).closest('li').attr('index');
				var l = $('input:checked',$('#' + oThis.options.id + '_column_menu_columns_ul')).length;
				if(oThis.gridCompColumnArr[index].options.visible){
					if(l==1){
						return false;
					}
					oThis.setColumnVisibleByIndex(index,false);
					$(this)[0].checked = false;
					oThis.gridCompColumnArr[index].options.visible = false;
				}else{
					oThis.setColumnVisibleByIndex(index,true);
					$(this)[0].checked = true;
					oThis.gridCompColumnArr[index].options.visible = true;
				}
				oThis.saveGridCompColumnArrToLocal();
				e.stopPropagation();
			});
			$('#' + this.options.id + '_column_menu_columns_ul li').on('click', function(e) {
				var index = $(this).attr('index');
				//获取选中列数量，不能小于1
				var l = $('input:checked',$('#' + oThis.options.id + '_column_menu_columns_ul')).length;
				if(oThis.gridCompColumnArr[index].options.visible){
					if(l==1){
						return false;
					}
					oThis.setColumnVisibleByIndex(index,false);
					$('input',$(this))[0].checked = false;
					oThis.gridCompColumnArr[index].options.visible = false;
				}else{
					oThis.setColumnVisibleByIndex(index,true);
					$('input',$(this))[0].checked = true;
					oThis.gridCompColumnArr[index].options.visible = true;
				}
				oThis.saveGridCompColumnArrToLocal();
			});
		},

		/*
		 * 定时器处理
		 */
		setIntervalFun: function(e) {
			this.widthChangeFunc();
			this.changeHeightFun();
		},
		
		
		
		
		/*
		 * grid区域创建完成之后处理
		 * 1、数据列显示处理
		 */
		afterGridDivsCreate:function(){
			this.columnsVisibleFun();
		},
		
		/*
		 * column是否显示处理
		 */
		columnsVisibleFun:function(){
			var oThis = this;
			$.each(this.gridCompColumnArr,function(){
				if(this.options.visible == false){
					oThis.setColumnVisibleByColumn(this,false);
				}
			});
		},
		/*
		 * 设置某列是否显示(传入column)
		 */
		setColumnVisibleByColumn:function(column,visible){
			var index = this.getIndexOfColumn(column);
			this.setColumnVisibleByIndex(index);
		},
		
		/*
		 * 设置某列是否显示(传入index为gridCompColumnArr中的数据)
		 */
		setColumnVisibleByIndex:function(index,visible){
			if(index >= 0){
				var column = this.gridCompColumnArr[index];
				var visibleIndex = this.getVisibleIndexOfColumn(column);
				if(visible){ //显示
					var htmlStr = '<col';
					if (this.gridCompColumnArr[index].options.width) {
						htmlStr += ' style="width:' + this.formatWidth(this.gridCompColumnArr[index].options.width) + '"';
					}
					htmlStr += '>';
					var nextVisibleIndex = this.getNextVisibleInidexOfColumn(column);
					if(nextVisibleIndex == -1){
						$('#' + this.options.id + '_header col:last')[0].insertAdjacentHTML('afterEnd',htmlStr);
						$('#' + this.options.id + '_content col:last')[0].insertAdjacentHTML('afterEnd',htmlStr);
					}else{
						$('#' + this.options.id + '_header col:eq(' + (nextVisibleIndex) + ')')[0].insertAdjacentHTML('beforeBegin',htmlStr);
						$('#' + this.options.id + '_content col:eq(' + (nextVisibleIndex) + ')')[0].insertAdjacentHTML('beforeBegin',htmlStr);
					}
					$('#' + this.options.id + '_header th:eq(' + index + ')').css('display', "");
					$('td:eq(' + index + ')',$('#' + this.options.id + '_content tbody tr')).css('display', "");
				}else{ //隐藏
					$('#' + this.options.id + '_header col:eq(' + visibleIndex + ')').remove();
					$('#' + this.options.id + '_header th:eq(' + index + ')').css('display', "none");
					$('#' + this.options.id + '_content col:eq(' + visibleIndex + ')').remove();
					$('td:eq(' + index + ')',$('#' + this.options.id + '_content tbody tr')).css('display', "none");
				}
				this.countWidth();
				this.saveGridCompColumnArrToLocal();
			}
		},
		
		/*
		 * 获取column属于第几列
		 */
		getIndexOfColumn:function(column){
			var index = -1;
			for(var i=0;i < this.gridCompColumnArr.length;i++){
				if(this.gridCompColumnArr[i] == column){
					index = i;
					break;
				}
			}
			return index;
		},
		/*
		 * 获取column属于当前显示第几列
		 */
		getVisibleIndexOfColumn:function(column){
			var index = -1;
			var j = 0;
			for(var i=0;i < this.gridCompColumnArr.length;i++){
				if(this.gridCompColumnArr[i] == column){
					if(!($('#' + this.options.id + '_header th:eq(' + i + ')').css('display') == 'none')){
						index = j;	
					}
					break;
				}
				if(!($('#' + this.options.id + '_header th:eq(' + i + ')').css('display') == 'none')){
					j++;
				}
			}
			return index;
		},
		/*
		 * 获取column后面第一个显示列所在第几列
		 */
		getNextVisibleInidexOfColumn:function(column){
			var index = -1;
			var flag = false;
			var j = 0;
			for(var i=0;i < this.gridCompColumnArr.length;i++){
				if(this.gridCompColumnArr[i] == column){
					flag = true;
				}
				if(flag == true && !($('#' + this.options.id + '_header th:eq(' + i + ')').css('display') == 'none')){
					index = j;	
					break;
				}
				if(!($('#' + this.options.id + '_header th:eq(' + i + ')').css('display') == 'none')){
					j++;
				}
			}
			return index;
		},
		
		
		/*
		 * 拖动开始
		 */
		dragStart: function(e) {
			this.dragFlag = true;
			this.dragStartX = e.clientX;
		},
		/*
		 * 改变列宽度处理
		 */
		dragFun: function(e) {
			if (this.dragFlag) {
				var nowTh = $('#' + this.options.id + '_resize_handle')[0].nowTh,
					$nowTh = $(nowTh),
					nowThIndex = $nowTh.attr('visibleIndex');
				if (nowTh) {
					this.dragEndX = e.clientX;
					var changeWidth = this.dragEndX - this.dragStartX,
						newWidth = nowTh.attrWidth + changeWidth;
					if (newWidth > this.minColumnWidth) {
						$('#' + this.options.id + '_header col:eq(' + nowThIndex + ')').css('width', newWidth + "px");
						$('#' + this.options.id + '_content col:eq(' + nowThIndex + ')').css('width', newWidth + "px");
						this.gridCompColumnArr[nowThIndex].options.width = newWidth;
					}
				}
				$('#' + this.options.id + '_top').css('display', 'block');
			}
		},
		/*
		 * 拖动结束
		 */
		dragEnd: function(e) {
			if (this.dragFlag) {
				this.countWidth();
				this.saveGridCompColumnArrToLocal();
			}
			$('#' + this.options.id + '_resize_handle')[0].nowTh = null;
			this.dragFlag = false;
			$('#' + this.options.id + '_top').css('display', 'none');
		},

		/*
		 * 交换列位置开始，并不修改swapColumnFlag，当移动的时候才修改swapColumnFlag
		 */
		swapColumnStart: function(e, ele) {
			this.swapColumnEle = ele;
			this.swapColumnStartX = e.clientX;
			this.swapColumnStartY = e.clientY;
		},
		/*
		 * 交换位置
		 */
		swapColumnFun: function(e) {
			var oThis = this;
			if (this.swapColumnFlag) {
				var nowTh = this.swapColumnEle,
					$nowTh = $(nowTh),
					nowGridCompColumn = nowTh.gridCompColumn;
				//创建拖动区域
				if ($('#' + this.options.id + '_clue').length == 0) {
					var $d = $('<div class="ufida-grid ufida-grid-header-drag-clue" id="' + this.options.id + '_clue" />').css({
						width: nowTh.scrollWidth + "px",
						left: nowTh.attrLeftTotalWidth - oThis.scrollLeft + oThis.leftW + "px",
						top: "0px",
						paddingLeft: $nowTh.css("paddingLeft"),
						paddingRight: $nowTh.css("paddingRight"),
						lineHeight: $nowTh.height() + "px",
						paddingTop: $nowTh.css("paddingTop"),
						paddingBottom: $nowTh.css("paddingBottom")
					}).html(nowGridCompColumn.options.title || nowGridCompColumn.options.field).prepend('<span class="fa fa-ban ufida-grid-header-drag-status" />');
					$('#' + this.options.id)[0].insertAdjacentElement('afterBegin',$d[0]);
				}
				this.swapColumnEndX = e.clientX;
				this.swapColumnEndY = e.clientY;
				var changeX = this.swapColumnEndX - this.swapColumnStartX,
					changeY = this.swapColumnEndY - this.swapColumnStartY;
				$('#' + this.options.id + '_clue').css({
					left: nowTh.attrLeftTotalWidth + changeX - oThis.scrollLeft + oThis.leftW + "px",
					top: changeY + "px"
				});

				// 创建提示div
				if ($('#' + this.options.id + '_swap_top').length == 0) {
					var $d = $('<span class="fa fa-sort-desc ufida-grid-header-swap-tip-span"  id="' + this.options.id + '_swap_top"/>');
					$d.css({
						top: $nowTh.height() + 'px'
					});
					var $d1 = $('<span class="fa fa-sort-asc ufida-grid-header-swap-tip-span" id="' + this.options.id + '_swap_down" />');
					$d1.css({
						top: '0px'
					});
					$('#' + this.options.id)[0].insertAdjacentElement('afterBegin',$d[0]);
					$('#' + this.options.id)[0].insertAdjacentElement('afterBegin',$d1[0]);
				}
				this.canSwap = false;
				$('#' + this.options.id + ' th').each(function(i) {
					var left = $(this).offset().left,
						right = left + parseInt(this.attrWidth);
					if (i == 0 && e.clientX < left) {
						// 移动到最左边
						if (oThis.swapColumnEle != this) {
							oThis.swapToColumnEle = 'LeftEle';
							$('#' + oThis.options.id + '_swap_top').css({
								left: -oThis.scrollLeft - 3 + oThis.leftW + 'px',
								display: 'block'
							});
							$('#' + oThis.options.id + '_swap_down').css({
								left: -oThis.scrollLeft - 3 + oThis.leftW + 'px',
								display: 'block'
							});
						}
						oThis.canSwap = true;
					} else if (left < e.clientX && e.clientX < right) {
						if (oThis.swapColumnEle != this && parseInt($(this).attr('index')) + 1 != parseInt($(oThis.swapColumnEle).attr('index'))) {
							if (oThis.swapToColumnEle != this) {
								oThis.swapToColumnEle = this;
								$('#' + oThis.options.id + '_swap_top').css({
									left: this.attrRightTotalWidth - oThis.scrollLeft - 3 + oThis.leftW + 'px',
									display: 'block'
								});
								$('#' + oThis.options.id + '_swap_down').css({
									left: this.attrRightTotalWidth - oThis.scrollLeft - 3 + oThis.leftW + 'px',
									display: 'block'
								});
							}
							oThis.canSwap = true;
							return false;
						}
					}
				});
				if (this.canSwap) {
					$('.ufida-grid-header-drag-status').removeClass('fa-ban').addClass('fa-plus-circle');
				} else {
					$('#' + this.options.id + '_swap_top').css('display', 'none');
					$('#' + this.options.id + '_swap_down').css('display', 'none');
					$('.ufida-grid-header-drag-status').removeClass('fa-plus-circle').addClass('fa-ban');
					this.swapToColumnEle = null;
				}
				$('#' + this.options.id + '_top').css('display', 'block');
			}
		},
		/*
		 * 交换位置结束
		 */
		swapColumnEnd: function(e) {
			var oThis = this;
			if (this.swapColumnFlag) {
				if (this.swapToColumnEle) {
					var swapColumnEle = this.swapColumnEle,
						swapToColumnEle = this.swapToColumnEle,
						swapColumnIndex = $(swapColumnEle).attr('index'),
						swapToColumnIndex = $(swapToColumnEle).attr('index'),
						swapGridCompColumn = this.gridCompColumnArr[swapColumnIndex];
					this.gridCompColumnArr.splice(parseInt(swapToColumnIndex) + 1, 0, swapGridCompColumn);
					if (swapColumnIndex < swapToColumnIndex)
						this.gridCompColumnArr.splice(swapColumnIndex, 1);
					else
						this.gridCompColumnArr.splice(parseInt(swapColumnIndex) + 1, 1);
					this.saveGridCompColumnArrToLocal();
					this.repaintGridDivs();
				}
				$('#' + this.options.id + '_clue').remove();
				$('#' + this.options.id + '_swap_top').css('display', 'none');
				$('#' + this.options.id + '_swap_down').css('display', 'none');
			}
			this.swapColumnFlag = false;
			$('#' + this.options.id + '_top').css('display', 'none');
		},
		/*
		 * 处理排序
		 */
		canSortable: function(e, ele) {
			var oThis = this,
				$ele = $(ele),
				field = $ele.attr('field'),
				sortable = oThis.getColumnAttr('sortable', field);
			if (sortable) {
				if ($(".fa-angle-up").parent().parent()[0] == ele) { //原来为升序，本次为降序
					$(".fa-angle-up").remove();
					$(ele.firstChild)[0].insertAdjacentHTML('beforeEnd','<span class="fa fa-angle-down ufida-grid-header-sort-span" ></span>');
					oThis.dataSourceObj.sortRows(field, "asc");
				} else if ($(".fa-angle-down").parent().parent()[0] == ele) { //原来为降序，本次为不排序
					$(".fa-angle-down").remove();
					oThis.dataSourceObj.sortRows();
				} else { //本次为升序
					$(".fa-angle-up").remove();
					$(".fa-angle-down").remove();
					$(ele.firstChild)[0].insertAdjacentHTML('beforeEnd','<span class="fa fa-angle-up ufida-grid-header-sort-span"></span>');
					oThis.dataSourceObj.sortRows(field, "desc");
				}
				oThis.rePairContentRows();
				oThis.afterGridDivsCreate();
			}
		},
		/*
		 * 计算拖动div所在位置
		 */
		headerThDrag: function(e, ele) {
			if (!this.dragFlag && !this.swapColumnFlag && ele && ele.gridCompColumn && ele.gridCompColumn.options.canDrag && $('#' + this.options.id + '_resize_handle')[0].nowTh != ele) {
				var $ele = $(ele);
				$('#' + this.options.id + '_resize_handle').css('left', ele.attrRightTotalWidth - this.scrollLeft - 4 + this.leftW);
				$('#' + this.options.id + '_resize_handle')[0].nowTh = ele;
			}
		},

		
	
		/*
		 * 修改第一列的css
		 */
		headerFirstClassFun:function(){
			$('#' + this.options.id + '_grid .ufida-grid-header-th-first').removeClass('ufida-grid-header-th-first');
			$('#' + this.options.id + '_grid th:eq(0)').addClass('ufida-grid-header-th-first');
		},
		
		/*
		 * 创建完成之后处理变量
		 */
		countWidth: function(e) {
			var oThis = this,
				totalW = 0;
			// 记录每列宽度及当前宽度之和
			$('#' + this.options.id + '_header th').each(function(i) {
				var w = this.offsetWidth;//判断是否设置了width
				var gridCompColumn = oThis.gridCompColumnArr[i];
				this.attrLeftTotalWidth = totalW;
				totalW += w;
				if (!$('#' + oThis.options.id + '_resize_handle')[0].nowTh && gridCompColumn.options.canDrag) {
					$('#' + oThis.options.id + '_resize_handle').css('left', w - 4 + oThis.leftW);
					$('#' + oThis.options.id + '_resize_handle')[0].nowTh = this;
				}
				this.gridCompColumn = gridCompColumn;
				this.attrWidth = w;
				this.attrRightTotalWidth = totalW;
			});
			$('#' + this.options.id + '_resize_handle').css('height', $('#' + this.options.id + '_header')[0].offsetHeight + 'px');
		},
		
		/*
		 * 整体宽度改变处理
		 */
		widthChangeFunc: function() {
			var w = $('#' + this.options.id)[0].offsetWidth;
			if(this.wholeWidth != w){
				this.wholeWidth = w;
				if (w > 300 && (this.showType == 'form' || this.showType == '')) {
					this.createGridDivs();
					$('#' + this.options.id + '_form').css('display', 'none');
					$('#' + this.options.id + '_grid').css('display', 'block');
					this.showType = 'grid';
				} else if (w > 0 && w < 300 && (this.showType == 'grid' || this.showType == '')) {
					this.createFromDivs();
					$('#' + this.options.id + '_grid').css('display', 'none');
					$('#' + this.options.id + '_form').css('display', 'block');
					this.showType = 'form';
				}
			}
		},
		
		/*
		 * 整体高度改变处理
		 */
		changeHeightFun: function() {
			var oldH = this.wholeHeight,
				h = $('#' + this.options.id)[0].offsetHeight;
			this.wholeHeight = h;
			if (oldH != h) {
				var contentH = h - this.exceptContentHeight > 0 ? h - this.exceptContentHeight : 0;
				$('#' + this.options.id + '_content').css('height', contentH + 'px');
			}
		},
		
		/*
		 * 获取本地个性化存储的设置
		 */
		getLocalData:function(){
			if (window.localStorage == null)
				return null;
			if (this.$sd_storageData != null)
				return this.$sd_storageData;
			else{
				if (window.localStorage.getItem(this.options.id) == null){
					try{
						window.localStorage.setItem(this.options.id,"{}");
					}
					catch(e){
						return null;
					}
				}
				var storageDataStr = window.localStorage.getItem(this.options.id);
				if(typeof(JSON) == "undefined")
					this.$sd_storageData = eval("("+storageDataStr+")");
				else
					this.$sd_storageData = JSON.parse(storageDataStr);
				return this.$sd_storageData; 
			}
		},
		/*
		 * 保存本地个性化存储的设置
		 */
		saveLocalData:function(){
			var oThis = this;
			if(this.saveSettimeout){
				clearTimeout(this.saveSettimeout);
			}
			this.saveSettimeout = setTimeout(function(){
				if (oThis.$sd_storageData == null || window.localStorage == null)
					return;
				var strogeDataStr = JSON.stringify(oThis.$sd_storageData);
				try{
					window.localStorage.setItem(oThis.options.id,strogeDataStr);
				}catch(e){
					
				}
			},200);
		},
		/*
		 * 清除本地个性化存储的设置
		 */
		clearLocalData:function(){
			if(this.saveSettimeout){
				clearTimeout(this.saveSettimeout);
			}
			window.localStorage.setItem(this.options.id,"{}");
			this.$sd_storageData = {};
		},
		/*
		 * 将数据列顺序保存至本地个性化存储
		 */
		saveGridCompColumnArrToLocal:function(){
			var defData = this.getLocalData();
			defData["gridCompColumnArr"] = this.gridCompColumnArr;
			this.saveLocalData();
		},
		/* 
		 * 从本地个性化存储中取出数据列顺序
		 */
		getGridCompColumnArrFromLocal:function(){
			var defData = this.getLocalData();
			if (defData == null) return null;
			if(defData["gridCompColumnArr"] == null) return null;
			return defData["gridCompColumnArr"];
		},
		/*
		 * 获取某列对应属性
		 */
		getColumnAttr: function(attr, field) {
			for (var i = 0; i < this.gridCompColumnArr.length; i++) {
				if (this.gridCompColumnArr[i].options.field == field) {
					return $(this.gridCompColumnArr[i].options).attr(attr);
				}
			}
			return "";
		},
		/*
		 * 对宽度和高度进行处理
		 */
		formatWidth: function(w) { // 获得宽度
			return (w + "").indexOf("%") > 0 ? w : parseInt(w) + "px";
		},
		/*
		 * 两个元素交换位置，要求传入参数e1在e2之前
		 */
		swapEle: function(e1, e2) {
			var n = e1.next(),
				p = e2.prev();
			e2.insertBefore(n);
			e1.insertAfter(p);
		},
		
		/*
		 * 克隆对象
		 */
		 cloneObj:function(obj){  
		    var o;  
		    if(typeof obj == "object"){  
		        if(obj === null){  
		            o = null;  
		        }else{  
		            if(obj instanceof Array){  
		                o = [];  
		                for(var i = 0, len = obj.length; i < len; i++){  
		                    o.push(this.cloneObj(obj[i]));  
		                }  
		            }else{  
		                o = {};  
		                for(var k in obj){  
		                    o[k] = this.cloneObj(obj[k]);  
		                }  
		            }  
		        }  
		    }else{  
		        o = obj;  
		    }  
		    return o;  
		}  
	};
		dataSource.prototype = {
		/*
		 * 将values转化为rows并进行排序
		 */
		sortRows: function(field, sortType) {
			//待完善 如果是数字的话设计排序，需要根据数据类型，未确定是dataset还是grid上定义
			var oThis = this;
			if (sortType == "asc") {
				this.rows.sort(function(a, b) {
					var v1 = $(b).attr(field);
					var v2 = $(a).attr(field);
					return v1.localeCompare(v2);
				});
			} else if (sortType == "desc") {
				this.rows.sort(function(a, b) {
					var v1 = $(a).attr(field);
					var v2 = $(b).attr(field);
					return v1.localeCompare(v2);
				});
			} else {
				oThis.rows = new Array();
				$.each(this.options.values, function() {
					oThis.rows.push(this);
				});
			}
		},

	};
	// 方法扩展
	$.fn.grid = function(options) {
		var g = new gridComp(this, options);
		return this;
	};
})(jQuery, window, document);
/* ========================================================================
 * UUI: mdlayout.js v0.0.1
 *
 * ========================================================================
 * Copyright 2014 yonyou, Inc.
 * Licensed under MIT ()
 * ======================================================================== */


+ function($) {
	'use strict';

	var MDLayout = function(element, options) {
		this.browser = _getBrowserInfo();
		var me = this;
		this.$element = $(element)
		this.options = $.extend({}, MDLayout.DEFAULTS, options)
		this.$element.css('position','relative').css('width','100%').css('height','100%').css('overflow','hidden')
		this.$master =  this.$element.find('[data-role="master"]')
		this.$detail =  this.$element.find('[data-role="detail"]')
		
		this.$master.css('float','left').css('height','100%')
		this.$detail.css('height','100%').css('overflow','hidden').css('position','relative');
		
		this.masterWidth = this.$master.width() 
		this.detailWidth = this.$detail.width()
		if (me.browser.ie && me.browser.ie < 9){
			this.$master.find('[data-role="page"]').css('position','absolute').css('height','100%').css('width','100%').hide().eq(0).show()
			this.$detail.find('[data-role="page"]').css('position','absolute').css('height','100%').css('width','100%').hide().eq(0).show()
		}
		else{
			this.$master.find('[data-role="page"]').css('position','absolute').css('transform','translate3d('+ this.masterWidth +'px,0,0)')
				.css('height','100%').css('width','100%').eq(0).css('transform','translate3d(0,0,0)')
			this.$detail.find('[data-role="page"]').css('position','absolute').css('left','0px').css('transform','translate3d('+ this.detailWidth +'px,0,0)')
				.css('height','100%').css('width','100%').eq(0).css('transform','translate3d(0,0,0)')
		}

		this.current_m_pageId = this.$master.find('[data-role="page"]').eq(0).attr('id');
		this.current_d_pageId = this.$detail.find('[data-role="page"]').eq(0).attr('id');
		this.mHistory = [];
		this.dHistory = [];
		this.isNarrow = null;
		this.response();
		$(window).resize(function(){
			me.response();
		})
		
	}

	
	MDLayout.DEFAULTS = {
		minWidth: 480,
//		masterFloat: false,
		afterNarrow:function(){},
		afterUnNarrow:function(){},
		afterMasterGo:function(pageId){},
		afterMasterBack:function(pageId){},
		afterDetailGo:function(pageId){},
		afterDetailBack:function(pageId){}
	}

	MDLayout.fn = MDLayout.prototype
	
	MDLayout.fn.response = function() {
		var totalWidth = this.$element.width();
		if (totalWidth < this.options.minWidth){
			if (this.isNarrow == null || this.isNarrow == false)
			this.isNarrow = true
			this.hideMaster()
			this.options.afterNarrow()
		}
		else{
			if (this.isNarrow == null || this.isNarrow == true)
			this.isNarrow = false
			this.showMaster()
			this.options.afterUnNarrow();
		}
		this.calcWidth();
		
	}
	
	MDLayout.fn.calcWidth = function(){
		if (!this.browser.ie || this.browser.ie > 8){
			this.detailWidth = this.$detail.width()
			this.masterWidth = this.$master.width()
			this.$detail.find('[data-role="page"]').css('transform','translate3d('+ this.detailWidth +'px,0,0)')
			this.$detail.find('#' + this.current_d_pageId).css('transform','translate3d(0,0,0)')
		}
		
	}
	
	MDLayout.fn.mGo = function(pageId) {
		if (this.current_m_pageId == pageId) return;
		this.mHistory.push(this.current_m_pageId);
		_hidePage(this.$master.find('#' + this.current_m_pageId),this,'-' + this.masterWidth)
		this.current_m_pageId = pageId
		_showPage(this.$master.find('#' + this.current_m_pageId),this)
		this.options.afterMasterGo(pageId);
	}	
	
	MDLayout.fn.mBack = function() {
		if (this.mHistory.length == 0) return;
		_hidePage(this.$master.find('#' + this.current_m_pageId),this,this.masterWidth)
		this.current_m_pageId = this.mHistory.pop();
		_showPage(this.$master.find('#' + this.current_m_pageId),this)
		this.options.afterMasterBack(this.current_d_pageId);
	}	

	MDLayout.fn.dGo = function(pageId) {
		if (this.current_d_pageId == pageId) return;
		this.dHistory.push(this.current_d_pageId);
		_hidePage(this.$detail.find('#' + this.current_d_pageId),this,'-' + this.detailWidth)
		this.current_d_pageId = pageId
		_showPage(this.$detail.find('#' + this.current_d_pageId),this)
		this.options.afterDetailGo(pageId);
	}	
	
	MDLayout.fn.dBack = function() {
		if (this.dHistory.length == 0) return;
		_hidePage(this.$detail.find('#' + this.current_d_pageId),this,this.detailWidth)
		this.current_d_pageId = this.dHistory.pop();
		_showPage(this.$detail.find('#' + this.current_d_pageId),this)
		this.options.afterDetailBack(this.current_d_pageId);
	}	
	
	MDLayout.fn.showMaster = function() {
		if (this.browser.ie && this.browser.ie < 9)
			this.$master.show()
		else{
			this.$master.css('transform','translate3d(0,0,0)').css('transition', 'all 300ms')
		}
		if (!this.isNarrow)
			this.$master.css('position','relative')					
	}	

	MDLayout.fn.hideMaster = function() {
		if (this.browser.ie && this.browser.ie < 9)
			this.$master.hide()
		else{
			this.$master.css('transform','translate3d(-'+ this.masterWidth +'px,0,0)').css('transition', 'all 300ms')
		}
		this.$master.css('position','absolute').css('z-index',5)
		this.calcWidth()
	}	

	/**
	 * masterFloat属性只有在宽屏下起作用，为true时，master层浮动于detail层之上
	 * 
	 */
//	MDLayout.fn.setMasterFloat = function(float){
//		this.masterFloat = float;
//		
//	}

	function _getBrowserInfo(){
	    var browser = {};
	    var ua = navigator.userAgent.toLowerCase();
	    var s;
	    (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? browser.ie = parseInt(s[1]) :
	    (s = ua.match(/msie ([\d.]+)/)) ? browser.ie = s[1] :
	    (s = ua.match(/firefox\/([\d.]+)/)) ? browser.firefox = s[1] :
	    (s = ua.match(/chrome\/([\d.]+)/)) ? browser.chrome = s[1] :
	    (s = ua.match(/opera.([\d.]+)/)) ? browser.opera = s[1] :
	    (s = ua.match(/version\/([\d.]+).*safari/)) ? browser.safari = s[1] : 0;	
	    return browser;
	}
	
	function _showPage($el,me){
		if (me.browser.ie && me.browser.ie < 9)
			$el.show()
		else{
			$el.css('transition', 'all 300ms').css('transform','translate3d(0,0,0)')
//			$el.show(400)
		}
	}
	
	function _hidePage($el,me,width){
		if (me.browser.ie && me.browser.ie < 9)
			$el.hide()
		else{
			$el.css('transition', 'all 300ms').css('transform','translate3d('+ width +'px,0,0)')
//			$el.hide(400);
		}
	}

	function Plugin(option) {
		if (this.length != 1) return;
		var $this = $(this)
		var data = $this.data('u.mdlayout')
		var options = typeof option == 'object' && option

		if (!data) $this.data('u.mdlayout', (data = new MDLayout(this, options)))
			//	else data.update(options);
		return data;
	}

	var old = $.fn.mdlayout

	$.fn.mdlayout = Plugin
	$.fn.mdlayout.Constructor = MDLayout



	$.fn.mdlayout.noConflict = function() {
		$.fn.mdlayout = old
		return this
	}

}(jQuery);
+ function($) {
	"use strict";

	var PageProxy = function(options, page) {
		this.isCurrent = function() {
			return page == options.currentPage;
		}

		this.isFirst = function() {
			return page == 1;
		}

		this.isLast = function() {
			return page == options.totalPages;
		}

		this.isPrev = function() {
			return page == (options.currentPage - 1);
		}

		this.isNext = function() {
			return page == (options.currentPage + 1);
		}

		this.isLeftOuter = function() {
			return page <= options.outerWindow;
		}

		this.isRightOuter = function() {
			return (options.totalPages - page) < options.outerWindow;
		}

		this.isInsideWindow = function() {
			if (options.currentPage < options.innerWindow + 1) {
				return page <= ((options.innerWindow * 2) + 1);
			} else if (options.currentPage > (options.totalPages - options.innerWindow)) {
				return (options.totalPages - page) <= (options.innerWindow * 2);
			} else {
				return Math.abs(options.currentPage - page) <= options.innerWindow;
			}
		}

		this.number = function() {
			return page;
		}
	}

	var View = {
		firstPage: function(pagin, options, currentPageProxy) {
			var li = $('<li>').append($('<a href="#">')
				.html(options.first)
				.bind('click.bs-pagin', function() {
					pagin.firstPage();
					return false;
				}));

			if (currentPageProxy.isFirst()) {
				li.addClass("disabled");
			}

			return li;
		},

		prevPage: function(pagin, options, currentPageProxy) {
			var li = $('<li>').append(
				$('<a href="#">')
				.attr("rel", "prev")
				.html(options.prev)
				.bind('click.bs-pagin', function() {
					pagin.prevPage();
					return false;
				}));

			if (currentPageProxy.isFirst()) {
				li.addClass("disabled");
			}

			return li;
		},

		nextPage: function(pagin, options, currentPageProxy) {
			var li = $('<li>').append(
				$('<a href="#">')
				.attr("rel", "next")
				.html(options.next)
				.bind('click.bs-pagin', function() {
					pagin.nextPage();
					return false;
				}));

			if (currentPageProxy.isLast()) {
				li.addClass("disabled");
			}

			return li;
		},

		lastPage: function(pagin, options, currentPageProxy) {
			var li = $('<li>').append(
				$('<a href="#">')
				.html(options.last)
				.bind('click.bs-pagin', function() {
					pagin.lastPage();
					return false;
				}));

			if (currentPageProxy.isLast()) {
				li.addClass("disabled");
			}

			return li;
		},

		gap: function(pagin, options) {
			return $('<li>').addClass("disabled")
				.append($('<a href="#">').html(options.gap));
		},

		page: function(pagin, options, pageProxy) {
				var li = $('<li>').append(function() {
					var link = $('<a href="#">');
					if (pageProxy.isNext()) {
						link.attr("rel", "next")
					}
					if (pageProxy.isPrev()) {
						link.attr("rel", "prev")
					}
					link.html(pageProxy.number());
					link.bind('click.bs-pagin', function() {
						pagin.page(pageProxy.number());
						return false;
					});
					return link;
				});

				if (pageProxy.isCurrent()) {
					li.addClass("active");
				}

				return li;
			}

	}


	var Pagination = function(element, options) {
		this.$element = $(element);
		this.options = $.extend({}, Pagination.DEFAULTS, options);

		this.$ul = this.$element; //.find("ul");
		this.render();
	}

	Pagination.DEFAULTS = {
		currentPage: 1,
		totalPages: 20,
		innerWindow: 2,
		outerWindow: 0,
		first: '&laquo;',
		prev: '&lsaquo;',
		next: '&rsaquo;',
		last: '&raquo;',
		gap: '..',
		truncate: false,
		page: function(page) {
			return true
		}
	}

	Pagination.prototype.update = function(options) {
		this.$ul.empty();
		this.options = $.extend({}, this.options, options);
		this.render();
	}	
	Pagination.prototype.render = function() {
		var options = this.options;

		if (!options.totalPages) {
			this.$element.hide();
			return;
		} else {
			this.$element.show();
		}

		var currentPageProxy = new PageProxy(options, options.currentPage);

		if (!currentPageProxy.isFirst() || !options.truncate) {
			if (options.first) {
				this.$ul.append(View.firstPage(this, options, currentPageProxy));
			}

			if (options.prev) {
				this.$ul.append(View.prevPage(this, options, currentPageProxy));
			}
		}

		var wasTruncated = false;
		for (var i = 1, length = options.totalPages; i <= length; i++) {
			var pageProxy = new PageProxy(options, i);
			if (pageProxy.isLeftOuter() || pageProxy.isRightOuter() || pageProxy.isInsideWindow()) {
				this.$ul.append(View.page(this, options, pageProxy));
				wasTruncated = false;
			} else {
				if (!wasTruncated && options.outerWindow > 0) {
					this.$ul.append(View.gap(this, options));
					wasTruncated = true;
				}
			}
		}

		if (!currentPageProxy.isLast() || !options.truncate) {
			if (options.next) {
				this.$ul.append(View.nextPage(this, options, currentPageProxy));
			}

			if (options.last) {
				this.$ul.append(View.lastPage(this, options, currentPageProxy));
			}
		}
	}

	Pagination.prototype.page = function(page, totalPages) {
		var options = this.options;

		if (totalPages === undefined) {
			totalPages = options.totalPages;
		}

		if (page > 0 && page <= totalPages) {
			if (options.page(page)) {
				this.$ul.empty();
				options.currentPage = page;
				options.totalPages = totalPages;
				this.render();
			}
		}

		return false;
	}

	Pagination.prototype.firstPage = function() {
		return this.page(1);
	}

	Pagination.prototype.lastPage = function() {
		return this.page(this.options.totalPages);
	}

	Pagination.prototype.nextPage = function() {
		return this.page(this.options.currentPage + 1);
	}

	Pagination.prototype.prevPage = function() {
		return this.page(this.options.currentPage - 1);
	}


	function Plugin(option) {
		var $this = $(this)
		var data = $this.data('u.pagination')
		var options = typeof option == 'object' && option

		if (!data) $this.data('u.pagination', (data = new Pagination(this, options)))
		else data.update(options);
		return data;
	}


	var old = $.fn.pagination;

	$.fn.pagination = Plugin
	$.fn.pagination.Constructor = Pagination


	$.fn.pagination.noConflict = function() {
		$.fn.pagination = old;
		return this;
	}

}(jQuery);
$(document).ready(function () {
    //***********************************BEGIN Grids*****************************       
    $('.grid .tools a.remove').on('click', function () {
        var removable = jQuery(this).parents(".grid");
        if (removable.next().hasClass('grid') || removable.prev().hasClass('grid')) {
            jQuery(this).parents(".grid").remove();
        } else {
            jQuery(this).parents(".grid").parent().remove();
        }
    });

    $('.grid .tools a.reload').on('click', function () {
        var el = jQuery(this).parents(".grid");
        blockUI(el);
        window.setTimeout(function () {
            unblockUI(el);
        }, 1000);
    });

    $('.grid .tools .shrink, .grid .tools .expand').on('click', function () {
        var el = jQuery(this).parents(".grid").children(".grid-body");
        if (jQuery(this).hasClass("shrink")) {
            jQuery(this).removeClass("shrink").addClass("expand");
            el.slideUp(200);
        } else {
            jQuery(this).removeClass("expand").addClass("shrink");
            el.slideDown(200);
        }
    });

    $('.user-info .shrink').on('click', function () {
        jQuery(this).parents(".user-info ").slideToggle();
    });
    //***********************************END Grids*****************************     
});

/**
 * @author zjh
 */
+function ($) {

    "use strict";

    // TREE CONSTRUCTOR AND PROTOTYPE

    /**
     * 树组件
     * @class Tree
     * @constructor
     * @example
     * 	js代码
     * 	$(function(){
			$('#ex-tree-basic').tree({
				data: treeData,
				loadingHTML: '<div class="static-loader">Loading...</div>',
				multiSelect: true,
				cacheItems: true,
				useChkBox:true
			});
		})
		
		html代码
		<div class="tree" id="ex-tree-basic"></div>
     */
    var Tree = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, $.fn.tree.defaults, options);
        //渲染，改成build建造方法
        this.build(options);
        //叶子节点点击的时候
        this.$element.on('click', '.tree-item', $.proxy( function(ev) { this.selectChildren(ev.currentTarget); } ,this));
        //父节点点击的时候
        this.$element.on('click', '.tree-folder-header', $.proxy( function(ev) { this.selectParent(ev.currentTarget); }, this));
        //复选框点击的时候
        this.$element.on('click',':checkbox',$.proxy(function(ev){this.checkParent(ev.currentTarget);},this));
        //右键点击树节点的时候，目前先暂定任意节点
        this.$element.on('mousedown','.tree-folder-name,.tree-item-name',$.proxy(function(ev){this.popMenu(ev.currentTarget,ev);},this));
        //添加鼠标右键事件监听
        this.$element.on('contextmenu','.tree-folder-header,.tree-item-name',$.proxy(function(ev){this.initContextmenu(ev);},this));

    };

    Tree.prototype = {
    	
        constructor: Tree,

        //建造方法，包括对参数ajaxUrl的判断，如果包含有该参数，则ajax方式获取，而不是data属性
        build: function(options){
            var self = this;
            if(options.ajaxUrl==""||options.ajaxUrl==null){
                self.render();
            }else{
                $.ajax({
                    type:"POST",
                    url:options.ajaxUrl,
                    dataType:"text",
                    data:options.reqParam,
                    success:function(data){
                        options.data = eval(data);
                        self.render();
                    },error:function(){

                    }
                });
            }
        },

        //渲染方法
        render: function () {
            this.populate(this.options.data, this.$element);
            this.$element.find('.tree-folder').show();
            this.$element.find('.tree-item').show();
        },
        populate: function (data, $el) {
            var self = this;
            $.each(data, function(index, value) {
                var $entity ;
                //如果还有子节点
                if(!self.isEmpty(value.children) || value.type == 'parent'){
                    $entity = self.createParent();
                    $entity.find('.tree-folder-name').html(value.title);
                    $entity.find('.tree-folder-header').data(value.id);
                    $entity.attr("id",value.id);
                    self.populate(value.children, $entity.find(".tree-folder-content:eq(0)"));
                    $entity.find(".tree-folder-content:eq(0)").hide();
                    //这里加上检测是否有自定义图标
                    if(value.icon){
                        $entity.children('.tree-folder-header').children("i").addClass(value.icon)
                            .prop("icon",value.icon);
                    }
                }else{
                    $entity = self.createChildren();
                    $entity.find('.tree-item-name').html(value.title);
                    $entity.attr("href",value.href);
                    $entity.attr("id",value.id);
                    $entity.data(value.id);
                    //这里加上检测是否有自定义图标，对于子节点，还有个bug
                    if(value.icon){
                        $entity.children("i").addClass(value.icon).prop("icon",value.icon);
                    }
                }
                $el.append($entity);
            });
        },
        isEmpty: function(obj){
            if(!obj){
                return true;
            }
            for (var i in obj ) {
                if(obj.hasOwnProperty(i)){
                    return false;
                }
            }
            return true;
        },
        createParent: function(){
            var $node;
            //如果采用复选框
            if(this.options.useChkBox){
                $node = $('<div class="tree-folder checkbox" style="display:none;">' +
                    '<input type="checkbox">'+
                    '<div class="tree-folder-header">' +
                    '<i class="glyphicon glyphicon-folder-close"></i>'+
                    '<div class="tree-folder-name"></div></div><div class="tree-folder-content"></div>'+
                    '<div class="tree-loader" style="display:none"></div></div>');
            }else{
                $node = $('<div class="tree-folder" style="display:none;">'+
                    '<div class="tree-folder-header"><i class="glyphicon glyphicon-folder-close"></i>'+
                    '<div class="tree-folder-name"></div></div><div class="tree-folder-content"></div>'+
                    '<div class="tree-loader" style="display:none"></div></div>');
            }

            return $node;
        },
        createChildren:function(){
            var $node;
            //如果采用复选框
            if(this.options.useChkBox){
                $node = $('<div class="tree-item checkbox" style="display:none;">'+
                    '<input type="checkbox">' +
                    '<div class="tree-item-name"></div></div>');
            }else{
                $node = $('<div class="tree-item" style="display:none;">'+
                    '<i class="glyphicon glyphicon-list-alt"></i><div class="tree-item-name"></div></div>');
            }

            return $node;
        },
        selectChildren: function (el) {
        	
            var $el = $(el);
            var $all = this.$element.find('.tree-selected');
            var data = [];
            
            //检测是否有外部函数
            var eventOnSelect = this.options.onSelect;
        	if(eventOnSelect){
        		eventOnSelect($el);
        		return;
        	}
        	//***************************
        	
            if (this.options.multiSelect) {
                $.each($all, function(index, value) {
                    var $val = $(value);
                    if($val[0] !== $el[0]) {
                        data.push( $(value).data() );
                    }
                });
            } else if ($all[0] !== $el[0]) {
                $all.removeClass('tree-selected')
                    .find('i').removeClass('glyphicon-ok').addClass('glyphicon-list-alt');
                data.push($el.data());
            }

            if($el.hasClass('tree-selected')) {
                $el.removeClass('tree-selected');
                $el.find('i').removeClass('glyphicon-ok').addClass('glyphicon-list-alt');
                //这里检测是否有icon属性
                if($el.find("i").prop("icon")){
                    $el.find("i").addClass($el.find("i").prop("icon"));
                }
            } else {
                $el.addClass ('tree-selected');
                $el.find('i').removeClass('glyphicon-list-alt').addClass('glyphicon-ok');
                if (this.options.multiSelect) {
                    data.push( $el.data() );
                }
            }
            //console.info("icon = " + $el.find("i").prop("icon"));

            if(data.length) {
                this.$element.trigger('selected', {info: data});
            }

        },

        selectParent: function (el) {
            var $el = $(el);
            var $par = $el.parent();

            if($el.find('.glyphicon-folder-close').length) {
                if ($par.find('.tree-folder-content').children().length) {
                    $par.find('.tree-folder-content:eq(0)').show();
                }

                $par.find('.glyphicon-folder-close:eq(0)')
                    .removeClass('glyphicon-folder-close')
                    .addClass('glyphicon-folder-open');

                this.$element.trigger('opened', {element:$el, data: $el.data()});
            } else {
                if(this.options.cacheItems) {
                    $par.find('.tree-folder-content:eq(0)').hide();
                } else {
                    $par.find('.tree-folder-content:eq(0)').empty();
                }

                $par.find('.glyphicon-folder-open:eq(0)')
                    .removeClass('glyphicon-folder-open')
                    .addClass('glyphicon-folder-close');
                this.$element.trigger('closed', {element:$el, data: $el.data()});
            }
        },

        selectedItems: function () {
            var $sel = this.$element.find('.tree-selected');
            var data = [];

            $.each($sel, function (index, value) {
                data.push($(value).data());
            });
            return data;
        }

        //新加函数，勾选父节点的复选框时，下面所有的子节点的复选框都要同样的勾选状态
        ,checkParent:function(el,ev){
            var $el = $(el);
            var isChecked = $el.prop("checked");
            $el.parent().find(":checkbox").prop("checked",isChecked);
        }

        //新加函数，弹出菜单
        ,popMenu:function(el,ev){
            var mouseMenu = this.options.mouseMenu;
            var $el = $(el);
            if(mouseMenu==null){
                return false;
            }
            if(ev.which==3){
                mouseMenu.hide();
                mouseMenu.css({
                    "position":"absolute",
                    "top":ev.clientY,			//这里需要再调试
                    "left":ev.clientX
                });
                mouseMenu.show("fast");
                //加上一个标记
                var $p = null;						//临时节点，存储parent
                if($el.hasClass("tree-folder-name")){
                    $p = $el.parent().parent();
                }else if($el.hasClass("tree-item-name")){
                    $p = $el.parent();
                }
                $el.prop("node",$p.attr("id"));
                console.info($el + ".node = " + $el.prop("node"));
            }
        },

        //鼠标右键事件监听
        initContextmenu: function(ev){
            this.$element.trigger('rightClick', ev);
        },
        //根据节点创建右键菜单
        createRightMenu: function(data){
            var self = this;
            $('.tree-right-menu').remove();
            var $element = $(data.element);
            var ev = data.event;
            var menuData = data.data;
            var menuHtml = new Array();
            menuHtml.push('<ul class="dropdown-menu tree-right-menu">');
            $.each(menuData, function(){
                menuHtml.push('<li action="'+this.action+'"><a>'+this.title+'</a></li>');
            });
            menuHtml.push('</ul>');
            $(menuHtml.join('')).appendTo($('body')).show()
                .css({position:'fixed', left: ev.pageX, top: ev.pageY})
                .on('mouseleave', function(){
                    $(this).remove();
                }).find('li').on('click', function(){
                    var $this = $(this);
                    if($element.hasClass('tree-item-name')){
                        self.$element.trigger($this.attr('action'), $element.parent());
                    }else{
                        self.$element.trigger($this.attr('action'), $element);
                    }
                    $this.parent().remove();
                });
        },
        //添加一个节点
        addChildren: function(data){
            var self = this;
            var node = $(data.node);
            var $entity = null;
            var menu = data.menu;
            if(data.type && data.type == 'parent'){
                $entity = self.createParent();
                $entity.find('.tree-folder-name').html(menu.title);
                $entity.find('.tree-folder-header').data(menu);
                $entity.on('click', {element: $(this)}, function(e){
                    self.selectParent(e.data.element);
                });
            }else{
                $entity = self.createChildren();
                $entity.find('.tree-item-name').html(menu.title);
                $entity.data(menu);
                $entity.on('click',{element: $(this)}, function(e){
                    self.selectChildren(e.data.element);
                });
            }
            $entity.show().on('contextmenu', function(ev){
                self.initContextmenu(ev);
            });
            node.parent().find('>.tree-folder-content').append($entity).show();
            if(node.find('.glyphicon-folder-close').length > 0){
                node.trigger('click');
            }
        },
        //删除一个节点
        removeChildren: function(data){
            $(data).remove();
        }
        //提供一个显示文本框用于重新设置标题的接口

    };


    // TREE PLUGIN DEFINITION

    $.fn.tree = function (option, value) {
        var methodReturn;

        var $set = this.each(function () {
            var $this = $(this);
            var data = $this.data('koala.tree');
            var options = typeof option === 'object' && option;

            if (!data) $this.data('koala.tree', (data = new Tree(this, options)));
            if (typeof option === 'string') methodReturn = data[option](value);
        });

        //如果有右键菜单，就把原来的右键除掉
        if(option.mouseMenu!=null){
            $(document).bind("contextmenu",function(){return false;});
        }

        //添加判断是否可拖放
        if(option.draggable){
			// sortable是jquery-ui提供的，暂不支持draggable
            //var $node = $(".tree");
            //$node.sortable({
                //items:".tree-folder,.tree-item"
				//,containment: $(this).parent()
            //});
            //$node.disableSelection();
        }

        return (methodReturn === undefined) ? $set : methodReturn;

    };

    //默认内置属性列表
    $.fn.tree.defaults = {
    	/**
    	 * 是否允许树节点多选
    	 * @property multiSelect
    	 * @type Boolean
    	 * @default false
    	 */
        multiSelect: false,
        /**
    	 * 载入数据时显示的html dom
    	 * @property loadingHTML
    	 * @type String
    	 * @default '<div>Loading...</div>'
    	 */
        loadingHTML: '<div>Loading...</div>',
        /**
    	 * 当父节点折叠时，子节点是否保存，如果设置为true，则单纯隐藏，设置为false，则清空其子节点
    	 * @property cacheItems
    	 * @type Boolean
    	 * @default true
    	 */
        cacheItems: true,
        /**
    	 * 是否带复选框
    	 * @property useChkBox
    	 * @type Boolean
    	 * @default false
    	 */
        useChkBox:false,
        /**
    	 * 节点可否拖放
    	 * @property draggable
    	 * @type Boolean
    	 * @default false
    	 */
        draggable:false,
//        /**
//    	 * 节点可否编辑
//    	 * @property multiSelect
//    	 * @type Boolean
//    	 * @default false
//    	 */
//        editable:false,
        /**
    	 * 右键弹出菜单，为下拉框的jQuery
    	 * @property mouseMenu
    	 * @type jQuery对象
    	 * @default null
    	 */
        mouseMenu:null,
        /**
    	 * 异步加载的url，一旦设置这个，取代原生的json data
    	 * @property ajaxUrl
    	 * @type String
    	 * @default ""
    	 */
        ajaxUrl:"",
        /**
    	 * 与ajaxUrl对应的请求参数，为一个{}对象
    	 * @property reqParam
    	 * @type js对象{}
    	 * @default null
    	 */
        reqParam:null,
        /**
    	 * 静态数据源，格式：
    	 * @property data
    	 * @type js对象{}
    	 * @default null
    	 */
        data:null
    };

    $.fn.tree.Constructor = Tree;

}(window.jQuery);

(function($,win,undef){
	var errorobj=null,//指示当前验证失败的表单元素;
		msgobj=null,//pop box object 
		msghidden=true;//msgbox hidden?

	var tipmsg={//默认提示文字;
		tit:"提示信息",
		w:{
			"*":"不能为空！",
			"*6-16":"请填写6到16位任意字符！",
			"n":"请填写数字！",
			"n6-16":"请填写6到16位数字！",
			"s":"不能输入特殊字符！",
			"s6-18":"请填写6到18位字符！",
			"p":"请填写邮政编码！",
			"m":"请填写手机号码！",
			"e":"邮箱地址格式不对！",
			"url":"请填写网址！"
		},
		def:"请填写正确信息！",
		undef:"datatype未定义！",
		reck:"两次输入的内容不一致！",
		r:"",
		c:"正在检测信息…",
		s:"请{填写|选择}{0|信息}！",
		v:"所填信息没有经过验证，请稍后…",
		p:"正在提交数据…"
	}
	$.Tipmsg=tipmsg;
	
	var Validform=function(forms,settings,inited){
		var settings=$.extend({},Validform.defaults,settings);
		
		settings.datatype && $.extend(Validform.util.dataType,settings.datatype);
		
		var brothers=this;
		brothers.tipmsg={w:{}};
		brothers.forms=forms;
		brothers.objects=[];
		
		//创建子对象时不再绑定事件;
		if(inited===true){
			return false;
		}
		
		forms.each(function(){
			//已经绑定事件时跳过，避免事件重复绑定;
			if(this.validform_inited=="inited"){return true;}
			this.validform_inited="inited";
			
			var curform=this;
			curform.settings=$.extend({},settings);
			
			var $this=$(curform);
			
			//防止表单按钮双击提交两次;
			curform.validform_status="normal"; //normal | posting | posted;
			
			//让每个Validform对象都能自定义tipmsg;	
			$this.data("tipmsg",brothers.tipmsg);

			//bind the blur event;
			$this.delegate("[datatype]","blur",function(){
				//判断是否是在提交表单操作时触发的验证请求；
				var subpost=arguments[1];
				Validform.util.check.call(this,$this,subpost);
			});
			
			$this.delegate(":text","keypress",function(event){
				if(event.keyCode==13 && $this.find(":submit").length==0){
					$this.submit();
				}
			});
			
			//点击表单元素，默认文字消失效果;
			//表单元素值比较时的信息提示增强;
			//radio、checkbox提示信息增强;
			//外调插件初始化;
			Validform.util.enhance.call($this,curform.settings.tiptype,curform.settings.usePlugin,curform.settings.tipSweep);
			
			curform.settings.btnSubmit && $this.find(curform.settings.btnSubmit).bind("click",function(){
				$this.trigger("submit");
				return false;
			});
						
			$this.submit(function(){
				var subflag=Validform.util.submitForm.call($this,curform.settings);
				subflag === undef && (subflag=true);
				return subflag;
			});
			
			$this.find("[type='reset']").add($this.find(curform.settings.btnReset)).bind("click",function(){
				Validform.util.resetForm.call($this);
			});
			
		});
		
		//预创建pop box;
		if( settings.tiptype==1 || (settings.tiptype==2 || settings.tiptype==3) && settings.ajaxPost ){		
			creatMsgbox();
		}
	}
	
	Validform.defaults={
		tiptype:1,
		tipSweep:false,
		showAllError:false,
		postonce:false,
		ajaxPost:false
	}
	
	Validform.util={
		dataType:{
			"*":/[\w\W]+/,
			"*6-16":/^[\w\W]{6,16}$/,
			"n":/^\d+$/,
			"n6-16":/^\d{6,16}$/,
			"s":/^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]+$/,
			"s6-18":/^[\u4E00-\u9FA5\uf900-\ufa2d\w\.\s]{6,18}$/,
			"p":/^[0-9]{6}$/,
			"m":/^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$/,
			"e":/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
			"url":/^(\w+:\/\/)?\w+(\.\w+)+.*$/
		},
		
		toString:Object.prototype.toString,
		
		isEmpty:function(val){
			return val==="" || val===$.trim(this.attr("tip"));
		},
		
		getValue:function(obj){
			var inputval,
				curform=this;
				
			if(obj.is(":radio")){
				inputval=curform.find(":radio[name='"+obj.attr("name")+"']:checked").val();
				inputval= inputval===undef ? "" : inputval;
			}else if(obj.is(":checkbox")){
				inputval="";
				curform.find(":checkbox[name='"+obj.attr("name")+"']:checked").each(function(){ 
					inputval +=$(this).val()+','; 
				})
				inputval= inputval===undef ? "" : inputval;
			}else{
				inputval=obj.val();
			}
			inputval=$.trim(inputval);
			
			return Validform.util.isEmpty.call(obj,inputval) ? "" : inputval;
		},
		
		enhance:function(tiptype,usePlugin,tipSweep,addRule){
			var curform=this;
			
			//页面上不存在提示信息的标签时，自动创建;
			curform.find("[datatype]").each(function(){
				if(tiptype==2){
					if($(this).parent().next().find(".Validform_checktip").length==0){
						$(this).parent().next().append("<span class='Validform_checktip' />");
						$(this).siblings(".Validform_checktip").remove();
					}
				}else if(tiptype==3 || tiptype==4){
					if($(this).siblings(".Validform_checktip").length==0){
						$(this).parent().append("<span class='Validform_checktip' />");
						$(this).parent().next().find(".Validform_checktip").remove();
					}
				}
			})
			
			//表单元素值比较时的信息提示增强;
			curform.find("input[recheck]").each(function(){
				//已经绑定事件时跳过;
				if(this.validform_inited=="inited"){return true;}
				this.validform_inited="inited";
				
				var _this=$(this);
				var recheckinput=curform.find("input[name='"+$(this).attr("recheck")+"']");
				recheckinput.bind("keyup",function(){
					if(recheckinput.val()==_this.val() && recheckinput.val() != ""){
						if(recheckinput.attr("tip")){
							if(recheckinput.attr("tip") == recheckinput.val()){return false;}
						}
						_this.trigger("blur");
					}
				}).bind("blur",function(){
					if(recheckinput.val()!=_this.val() && _this.val()!=""){
						if(_this.attr("tip")){
							if(_this.attr("tip") == _this.val()){return false;}	
						}
						_this.trigger("blur");
					}
				});
			});
			
			//hasDefaultText;
			curform.find("[tip]").each(function(){//tip是表单元素的默认提示信息,这是点击清空效果;
				//已经绑定事件时跳过;
				if(this.validform_inited=="inited"){return true;}
				this.validform_inited="inited";
				
				var defaultvalue=$(this).attr("tip");
				var altercss=$(this).attr("altercss");
				$(this).focus(function(){
					if($(this).val()==defaultvalue){
						$(this).val('');
						if(altercss){$(this).removeClass(altercss);}
					}
				}).blur(function(){
					if($.trim($(this).val())===''){
						$(this).val(defaultvalue);
						if(altercss){$(this).addClass(altercss);}
					}
				});
			});
			
			//enhance info feedback for checkbox & radio;
			curform.find(":checkbox[datatype],:radio[datatype]").each(function(){
				//已经绑定事件时跳过;
				if(this.validform_inited=="inited"){return true;}
				this.validform_inited="inited";
				
				var _this=$(this);
				var name=_this.attr("name");
				curform.find("[name='"+name+"']").filter(":checkbox,:radio").bind("click",function(){
					//避免多个事件绑定时的取值滞后问题;
					setTimeout(function(){
						_this.trigger("blur");
					},0);
				});
				
			});
			
			//select multiple;
			curform.find("select[datatype][multiple]").bind("click",function(){
				var _this=$(this);
				setTimeout(function(){
					_this.trigger("blur");
				},0);
			});
			
			//plugins here to start;
			Validform.util.usePlugin.call(curform,usePlugin,tiptype,tipSweep,addRule);
		},
		
		usePlugin:function(plugin,tiptype,tipSweep,addRule){
			/*
				plugin:settings.usePlugin;
				tiptype:settings.tiptype;
				tipSweep:settings.tipSweep;
				addRule:是否在addRule时触发;
			*/

			var curform=this,
				plugin=plugin || {};
			//swfupload;
			if(curform.find("input[plugin='swfupload']").length && typeof(swfuploadhandler) != "undefined"){
				
				var custom={
						custom_settings:{
							form:curform,
							showmsg:function(msg,type,obj){
								Validform.util.showmsg.call(curform,msg,tiptype,{obj:curform.find("input[plugin='swfupload']"),type:type,sweep:tipSweep});	
							}	
						}	
					};

				custom=$.extend(true,{},plugin.swfupload,custom);
				
				curform.find("input[plugin='swfupload']").each(function(n){
					if(this.validform_inited=="inited"){return true;}
					this.validform_inited="inited";
					
					$(this).val("");
					swfuploadhandler.init(custom,n);
				});
				
			}
			
			//datepicker;
			if(curform.find("input[plugin='datepicker']").length && $.fn.datePicker){
				plugin.datepicker=plugin.datepicker || {};
				
				if(plugin.datepicker.format){
					Date.format=plugin.datepicker.format; 
					delete plugin.datepicker.format;
				}
				if(plugin.datepicker.firstDayOfWeek){
					Date.firstDayOfWeek=plugin.datepicker.firstDayOfWeek; 
					delete plugin.datepicker.firstDayOfWeek;
				}

				curform.find("input[plugin='datepicker']").each(function(n){
					if(this.validform_inited=="inited"){return true;}
					this.validform_inited="inited";
					
					plugin.datepicker.callback && $(this).bind("dateSelected",function(){
						var d=new Date( $.event._dpCache[this._dpId].getSelected()[0] ).asString(Date.format);
						plugin.datepicker.callback(d,this);
					});
					$(this).datePicker(plugin.datepicker);
				});
			}
			
			//passwordstrength;
			if(curform.find("input[plugin*='passwordStrength']").length && $.fn.passwordStrength){
				plugin.passwordstrength=plugin.passwordstrength || {};
				plugin.passwordstrength.showmsg=function(obj,msg,type){
					Validform.util.showmsg.call(curform,msg,tiptype,{obj:obj,type:type,sweep:tipSweep});
				};
				
				curform.find("input[plugin='passwordStrength']").each(function(n){
					if(this.validform_inited=="inited"){return true;}
					this.validform_inited="inited";
					
					$(this).passwordStrength(plugin.passwordstrength);
				});
			}
			
			//jqtransform;
			if(addRule!="addRule" && plugin.jqtransform && $.fn.jqTransSelect){
				if(curform[0].jqTransSelected=="true"){return;};
				curform[0].jqTransSelected="true";
				
				var jqTransformHideSelect = function(oTarget){
					var ulVisible = $('.jqTransformSelectWrapper ul:visible');
					ulVisible.each(function(){
						var oSelect = $(this).parents(".jqTransformSelectWrapper:first").find("select").get(0);
						//do not hide if click on the label object associated to the select
						if( !(oTarget && oSelect.oLabel && oSelect.oLabel.get(0) == oTarget.get(0)) ){$(this).hide();}
					});
				};
				
				/* Check for an external click */
				var jqTransformCheckExternalClick = function(event) {
					if ($(event.target).parents('.jqTransformSelectWrapper').length === 0) { jqTransformHideSelect($(event.target)); }
				};
				
				var jqTransformAddDocumentListener = function (){
					$(document).mousedown(jqTransformCheckExternalClick);
				};
				
				if(plugin.jqtransform.selector){
					curform.find(plugin.jqtransform.selector).filter('input:submit, input:reset, input[type="button"]').jqTransInputButton();
					curform.find(plugin.jqtransform.selector).filter('input:text, input:password').jqTransInputText();			
					curform.find(plugin.jqtransform.selector).filter('input:checkbox').jqTransCheckBox();
					curform.find(plugin.jqtransform.selector).filter('input:radio').jqTransRadio();
					curform.find(plugin.jqtransform.selector).filter('textarea').jqTransTextarea();
					if(curform.find(plugin.jqtransform.selector).filter("select").length > 0 ){
						 curform.find(plugin.jqtransform.selector).filter("select").jqTransSelect();
						 jqTransformAddDocumentListener();
					}
					
				}else{
					curform.jqTransform();
				}
				
				curform.find(".jqTransformSelectWrapper").find("li a").click(function(){
					$(this).parents(".jqTransformSelectWrapper").find("select").trigger("blur");	
				});
			}

		},
		
		getNullmsg:function(curform){
			var obj=this;
			var reg=/[\u4E00-\u9FA5\uf900-\ufa2da-zA-Z\s]+/g;
			var nullmsg;
			
			var label=curform[0].settings.label || ".Validform_label";
			label=obj.siblings(label).eq(0).text() || obj.siblings().find(label).eq(0).text() || obj.parent().siblings(label).eq(0).text() || obj.parent().siblings().find(label).eq(0).text();
			label=label.replace(/\s(?![a-zA-Z])/g,"").match(reg);
			label=label? label.join("") : [""];

			reg=/\{(.+)\|(.+)\}/;
			nullmsg=curform.data("tipmsg").s || tipmsg.s;
			
			if(label != ""){
				nullmsg=nullmsg.replace(/\{0\|(.+)\}/,label);
				if(obj.attr("recheck")){
					nullmsg=nullmsg.replace(/\{(.+)\}/,"");
					obj.attr("nullmsg",nullmsg);
					return nullmsg;
				}
			}else{
				nullmsg=obj.is(":checkbox,:radio,select") ? nullmsg.replace(/\{0\|(.+)\}/,"") : nullmsg.replace(/\{0\|(.+)\}/,"$1");
			}
			nullmsg=obj.is(":checkbox,:radio,select") ? nullmsg.replace(reg,"$2") : nullmsg.replace(reg,"$1");
			
			obj.attr("nullmsg",nullmsg);
			return nullmsg;
		},
		
		getErrormsg:function(curform,datatype,recheck){
			var regxp=/^(.+?)((\d+)-(\d+))?$/,
				regxp2=/^(.+?)(\d+)-(\d+)$/,
				regxp3=/(.*?)\d+(.+?)\d+(.*)/,
				mac=datatype.match(regxp),
				temp,str;
			
			//如果是值不一样而报错;
			if(recheck=="recheck"){
				str=curform.data("tipmsg").reck || tipmsg.reck;
				return str;
			}
			
			var tipmsg_w_ex=$.extend({},tipmsg.w,curform.data("tipmsg").w);
			
			//如果原来就有，直接显示该项的提示信息;
			if(mac[0] in tipmsg_w_ex){
				return curform.data("tipmsg").w[mac[0]] || tipmsg.w[mac[0]];
			}
			
			//没有的话在提示对象里查找相似;
			for(var name in tipmsg_w_ex){
				if(name.indexOf(mac[1])!=-1 && regxp2.test(name)){
					str=(curform.data("tipmsg").w[name] || tipmsg.w[name]).replace(regxp3,"$1"+mac[3]+"$2"+mac[4]+"$3");
					curform.data("tipmsg").w[mac[0]]=str;
					
					return str;
				}
				
			}
			
			return curform.data("tipmsg").def || tipmsg.def;
		},

		_regcheck:function(datatype,gets,obj,curform){
			var curform=curform,
				info=null,
				passed=false,
				reg=/\/.+\//g,
				regex=/^(.+?)(\d+)-(\d+)$/,
				type=3;//default set to wrong type, 2,3,4;
				
			//datatype有三种情况：正则，函数和直接绑定的正则;
			
			//直接是正则;
			if(reg.test(datatype)){
				var regstr=datatype.match(reg)[0].slice(1,-1);
				var param=datatype.replace(reg,"");
				var rexp=RegExp(regstr,param);

				passed=rexp.test(gets);

			//function;
			}else if(Validform.util.toString.call(Validform.util.dataType[datatype])=="[object Function]"){
				passed=Validform.util.dataType[datatype](gets,obj,curform,Validform.util.dataType);
				if(passed === true || passed===undef){
					passed = true;
				}else{
					info= passed;
					passed=false;
				}
			
			//自定义正则;	
			}else{
				//自动扩展datatype;
				if(!(datatype in Validform.util.dataType)){
					var mac=datatype.match(regex),
						temp;
						
					if(!mac){
						passed=false;
						info=curform.data("tipmsg").undef||tipmsg.undef;
					}else{
						for(var name in Validform.util.dataType){
							temp=name.match(regex);
							if(!temp){continue;}
							if(mac[1]===temp[1]){
								var str=Validform.util.dataType[name].toString(),
									param=str.match(/\/[mgi]*/g)[1].replace("\/",""),
									regxp=new RegExp("\\{"+temp[2]+","+temp[3]+"\\}","g");
								str=str.replace(/\/[mgi]*/g,"\/").replace(regxp,"{"+mac[2]+","+mac[3]+"}").replace(/^\//,"").replace(/\/$/,"");
								Validform.util.dataType[datatype]=new RegExp(str,param);
								break;
							}	
						}
					}
				}
				
				if(Validform.util.toString.call(Validform.util.dataType[datatype])=="[object RegExp]"){
					passed=Validform.util.dataType[datatype].test(gets);
				}
					
			}
			
			
			if(passed){
				type=2;
				info=obj.attr("sucmsg") || curform.data("tipmsg").r||tipmsg.r;
				
				//规则验证通过后，还需要对绑定recheck的对象进行值比较;
				if(obj.attr("recheck")){
					var theother=curform.find("input[name='"+obj.attr("recheck")+"']:first");
					if(gets!=theother.val()){
						passed=false;
						type=3;
						info=obj.attr("errormsg")  || Validform.util.getErrormsg.call(obj,curform,datatype,"recheck");
					}
				}
			}else{
				info=info || obj.attr("errormsg") || Validform.util.getErrormsg.call(obj,curform,datatype);
				
				//验证不通过且为空时;
				if(Validform.util.isEmpty.call(obj,gets)){
					info=obj.attr("nullmsg") || Validform.util.getNullmsg.call(obj,curform);
				}
			}
			
			return{
					passed:passed,
					type:type,
					info:info
			};
			
		},
		
		regcheck:function(datatype,gets,obj){
			/*
				datatype:datatype;
				gets:inputvalue;
				obj:input object;
			*/
			var curform=this,
				info=null,
				passed=false,
				type=3;//default set to wrong type, 2,3,4;
				
			//ignore;
			if(obj.attr("ignore")==="ignore" && Validform.util.isEmpty.call(obj,gets)){				
				if(obj.data("cked")){
					info="";	
				}
				
				return {
					passed:true,
					type:4,
					info:info
				};
			}

			obj.data("cked","cked");//do nothing if is the first time validation triggered;
			
			var dtype=Validform.util.parseDatatype(datatype);
			var res;
			for(var eithor=0; eithor<dtype.length; eithor++){
				for(var dtp=0; dtp<dtype[eithor].length; dtp++){
					res=Validform.util._regcheck(dtype[eithor][dtp],gets,obj,curform);
					if(!res.passed){
						break;
					}
				}
				if(res.passed){
					break;
				}
			}
			return res;
			
		},
		
		parseDatatype:function(datatype){
			/*
				字符串里面只能含有一个正则表达式;
				Datatype名称必须是字母，数字、下划线或*号组成;
				datatype="/regexp/|phone|tel,s,e|f,e";
				==>[["/regexp/"],["phone"],["tel","s","e"],["f","e"]];
			*/

			var reg=/\/.+?\/[mgi]*(?=(,|$|\||\s))|[\w\*-]+/g,
				dtype=datatype.match(reg),
				sepor=datatype.replace(reg,"").replace(/\s*/g,"").split(""),
				arr=[],
				m=0;
				
			arr[0]=[];
			arr[0].push(dtype[0]);
			for(var n=0;n<sepor.length;n++){
				if(sepor[n]=="|"){
					m++;
					arr[m]=[];
				}
				arr[m].push(dtype[n+1]);
			}
			
			return arr;
		},

		showmsg:function(msg,type,o,triggered){
			/*
				msg:提示文字;
				type:提示信息显示方式;
				o:{obj:当前对象, type:1=>正在检测 | 2=>通过, sweep:true | false}, 
				triggered:在blur或提交表单触发的验证中，有些情况不需要显示提示文字，如自定义弹出提示框的显示方式，不需要每次blur时就马上弹出提示;
				
				tiptype:1\2\3时都有坑能会弹出自定义提示框
				tiptype:1时在triggered bycheck时不弹框
				tiptype:2\3时在ajax时弹框
				tipSweep为true时在triggered bycheck时不触发showmsg，但ajax出错的情况下要提示
			*/
			
			//如果msg为undefined，那么就没必要执行后面的操作，ignore有可能会出现这情况;
			if(msg==undef){return;}
			
			//tipSweep为true，且当前不是处于错误状态时，blur事件不触发信息显示;
			if(triggered=="bycheck" && o.sweep && (o.obj && !o.obj.is(".Validform_error") || typeof type == "function")){return;}

			$.extend(o,{curform:this});
				
			if(typeof type == "function"){
				type(msg,o,Validform.util.cssctl);
				return;
			}
			
			if(type==1 || triggered=="byajax" && type!=4){
				msgobj.find(".Validform_info").html(msg);
			}
			
			//tiptypt=1时，blur触发showmsg，验证是否通过都不弹框，提交表单触发的话，只要验证出错，就弹框;
			if(type==1 && triggered!="bycheck" && o.type!=2 || triggered=="byajax" && type!=4){
				msghidden=false;
				msgobj.find(".iframe").css("height",msgobj.outerHeight());
				msgobj.show();
				setCenter(msgobj,100);
			}

			if(type==2 && o.obj){
				o.obj.parent().next().find(".Validform_checktip").html(msg);
				Validform.util.cssctl(o.obj.parent().next().find(".Validform_checktip"),o.type);
			}
			
			if((type==3 || type==4) && o.obj){
				o.obj.siblings(".Validform_checktip").html(msg);
				Validform.util.cssctl(o.obj.siblings(".Validform_checktip"),o.type);
			}

		},

		cssctl:function(obj,status){
			switch(status){
				case 1:
					obj.removeClass("Validform_right Validform_wrong").addClass("Validform_checktip Validform_loading");//checking;
					break;
				case 2:
					obj.removeClass("Validform_wrong glyphicon glyphicon-remove").addClass("Validform_right glyphicon glyphicon-ok");//passed;
					break;
				case 4:
					obj.removeClass("Validform_right Validform_wrong Validform_loading").addClass("Validform_checktip");//for ignore;
					break;
				default:
					obj.removeClass("Validform_right glyphicon glyphicon-ok").addClass("Validform_wrong glyphicon glyphicon-remove");//wrong;
			}
		},
		
		check:function(curform,subpost,bool){
			/*
				检测单个表单元素;
				验证通过返回true，否则返回false、实时验证返回值为ajax;
				bool，传入true则只检测不显示提示信息;
			*/
			var settings=curform[0].settings;
			var subpost=subpost || "";
			var inputval=Validform.util.getValue.call(curform,$(this));
			
			//隐藏或绑定dataIgnore的表单对象不做验证;
			if(settings.ignoreHidden && $(this).is(":hidden") || $(this).data("dataIgnore")==="dataIgnore"){
				return true;
			}
			
			//dragonfly=true时，没有绑定ignore，值为空不做验证，但验证不通过;
			if(settings.dragonfly && !$(this).data("cked") && Validform.util.isEmpty.call($(this),inputval) && $(this).attr("ignore")!="ignore"){
				return false;
			}
			
			var flag=Validform.util.regcheck.call(curform,$(this).attr("datatype"),inputval,$(this));
			
			//值没变化不做检测，这时要考虑recheck情况;
			//不是在提交表单时触发的ajax验证;
			if(inputval==this.validform_lastval && !$(this).attr("recheck") && subpost==""){
				return flag.passed ? true : false;
			}

			this.validform_lastval=inputval;//存储当前值;
			
			var _this;
			errorobj=_this=$(this);
			
			if(!flag.passed){
				//取消正在进行的ajax验证;
				Validform.util.abort.call(_this[0]);
				
				if(!bool){
					//传入"bycheck"，指示当前是check方法里调用的，当tiptype=1时，blur事件不让触发错误信息显示;
					Validform.util.showmsg.call(curform,flag.info,settings.tiptype,{obj:$(this),type:flag.type,sweep:settings.tipSweep},"bycheck");
					
					!settings.tipSweep && _this.addClass("Validform_error");
				}
				return false;
			}
			
			//验证通过的话，如果绑定有ajaxurl，要执行ajax检测;
			//当ignore="ignore"时，为空值可以通过验证，这时不需要ajax检测;
			var ajaxurl=$(this).attr("ajaxurl");
			if(ajaxurl && !Validform.util.isEmpty.call($(this),inputval) && !bool){
				var inputobj=$(this);

				//当提交表单时，表单中的某项已经在执行ajax检测，这时需要让该项ajax结束后继续提交表单;
				if(subpost=="postform"){
					inputobj[0].validform_subpost="postform";
				}else{
					inputobj[0].validform_subpost="";
				}
				
				if(inputobj[0].validform_valid==="posting" && inputval==inputobj[0].validform_ckvalue){return "ajax";}
				
				inputobj[0].validform_valid="posting";
				inputobj[0].validform_ckvalue=inputval;
				Validform.util.showmsg.call(curform,curform.data("tipmsg").c||tipmsg.c,settings.tiptype,{obj:inputobj,type:1,sweep:settings.tipSweep},"bycheck");
				
				Validform.util.abort.call(_this[0]);
				
				var ajaxsetup=$.extend(true,{},settings.ajaxurl || {});
								
				var localconfig={
					type: "POST",
					cache:false,
					url: ajaxurl,
					data: "param="+encodeURIComponent(inputval)+"&name="+encodeURIComponent($(this).attr("name")),
					success: function(data){
						if($.trim(data.status)==="y"){
							inputobj[0].validform_valid="true";
							data.info && inputobj.attr("sucmsg",data.info);
							Validform.util.showmsg.call(curform,inputobj.attr("sucmsg") || curform.data("tipmsg").r||tipmsg.r,settings.tiptype,{obj:inputobj,type:2,sweep:settings.tipSweep},"bycheck");
							_this.removeClass("Validform_error");
							errorobj=null;
							if(inputobj[0].validform_subpost=="postform"){
								curform.trigger("submit");
							}
						}else{
							inputobj[0].validform_valid=data.info;
							Validform.util.showmsg.call(curform,data.info,settings.tiptype,{obj:inputobj,type:3,sweep:settings.tipSweep});
							_this.addClass("Validform_error");
						}
						_this[0].validform_ajax=null;
					},
					error: function(data){
						if(data.status=="200"){
							if(data.responseText=="y"){
								ajaxsetup.success({"status":"y"});
							}else{
								ajaxsetup.success({"status":"n","info":data.responseText});	
							}
							return false;
						}
						
						//正在检测时，要检测的数据发生改变，这时要终止当前的ajax。不是这种情况引起的ajax错误，那么显示相关错误信息;
						if(data.statusText!=="abort"){
							var msg="status: "+data.status+"; statusText: "+data.statusText;
						
							Validform.util.showmsg.call(curform,msg,settings.tiptype,{obj:inputobj,type:3,sweep:settings.tipSweep});
							_this.addClass("Validform_error");
						}
						
						inputobj[0].validform_valid=data.statusText;
						_this[0].validform_ajax=null;
						
						//localconfig.error返回true表示还需要执行temp_err;
						return true;
					}
				}
				
				if(ajaxsetup.success){
					var temp_suc=ajaxsetup.success;
					ajaxsetup.success=function(data){
						localconfig.success(data);
						temp_suc(data,inputobj);
					}
				}
				
				if(ajaxsetup.error){
					var temp_err=ajaxsetup.error;
					ajaxsetup.error=function(data){
						//localconfig.error返回false表示不需要执行temp_err;
						localconfig.error(data) && temp_err(data,inputobj);
					}	
				}

				ajaxsetup=$.extend({},localconfig,ajaxsetup,{dataType:"json"});
				_this[0].validform_ajax=$.ajax(ajaxsetup);
				
				return "ajax";
			}else if(ajaxurl && Validform.util.isEmpty.call($(this),inputval)){
				Validform.util.abort.call(_this[0]);
				_this[0].validform_valid="true";
			}
			
			if(!bool){
				Validform.util.showmsg.call(curform,flag.info,settings.tiptype,{obj:$(this),type:flag.type,sweep:settings.tipSweep},"bycheck");
				_this.removeClass("Validform_error");
			}
			errorobj=null;
			
			return true;
		
		},
		
		submitForm:function(settings,flg,url,ajaxPost,sync){
			/*
				flg===true时跳过验证直接提交;
				ajaxPost==="ajaxPost"指示当前表单以ajax方式提交;
			*/
			var curform=this;
			
			//表单正在提交时点击提交按钮不做反应;
			if(curform[0].validform_status==="posting"){return false;}
			
			//要求只能提交一次时;
			if(settings.postonce && curform[0].validform_status==="posted"){return false;}
			
			var beforeCheck=settings.beforeCheck && settings.beforeCheck(curform);
			if(beforeCheck===false){return false;}
			
			var flag=true,
				inflag;
				
			curform.find("[datatype]").each(function(){
				//跳过验证;
				if(flg){
					return false;
				}
				
				//隐藏或绑定dataIgnore的表单对象不做验证;
				if(settings.ignoreHidden && $(this).is(":hidden") || $(this).data("dataIgnore")==="dataIgnore"){
					return true;
				}
				
				var inputval=Validform.util.getValue.call(curform,$(this)),
					_this;
				errorobj=_this=$(this);
				
				inflag=Validform.util.regcheck.call(curform,$(this).attr("datatype"),inputval,$(this));
				
				if(!inflag.passed){
					Validform.util.showmsg.call(curform,inflag.info,settings.tiptype,{obj:$(this),type:inflag.type,sweep:settings.tipSweep});
					_this.addClass("Validform_error");
					
					if(!settings.showAllError){
						_this.focus();
						flag=false;
						return false;
					}
					
					flag && (flag=false);
					return true;
				}
				
				//当ignore="ignore"时，为空值可以通过验证，这时不需要ajax检测;
				if($(this).attr("ajaxurl") && !Validform.util.isEmpty.call($(this),inputval)){
					if(this.validform_valid!=="true"){
						var thisobj=$(this);
						Validform.util.showmsg.call(curform,curform.data("tipmsg").v||tipmsg.v,settings.tiptype,{obj:thisobj,type:3,sweep:settings.tipSweep});
						_this.addClass("Validform_error");
						
						thisobj.trigger("blur",["postform"]);//continue the form post;
						
						if(!settings.showAllError){
							flag=false;
							return false;
						}
						
						flag && (flag=false);
						return true;
					}
				}else if($(this).attr("ajaxurl") && Validform.util.isEmpty.call($(this),inputval)){
					Validform.util.abort.call(this);
					this.validform_valid="true";
				}

				Validform.util.showmsg.call(curform,inflag.info,settings.tiptype,{obj:$(this),type:inflag.type,sweep:settings.tipSweep});
				_this.removeClass("Validform_error");
				errorobj=null;
			});
			
			if(settings.showAllError){
				curform.find(".Validform_error:first").focus();
			}

			if(flag){
				var beforeSubmit=settings.beforeSubmit && settings.beforeSubmit(curform);
				if(beforeSubmit===false){return false;}
				
				curform[0].validform_status="posting";
							
				if(settings.ajaxPost || ajaxPost==="ajaxPost"){
					//获取配置参数;
					var ajaxsetup=$.extend(true,{},settings.ajaxpost || {});
					//有可能需要动态的改变提交地址，所以把action所指定的url层级设为最低;
					ajaxsetup.url=url || ajaxsetup.url || settings.url || curform.attr("action");
					
					//byajax：ajax时，tiptye为1、2或3需要弹出提示框;
					Validform.util.showmsg.call(curform,curform.data("tipmsg").p||tipmsg.p,settings.tiptype,{obj:curform,type:1,sweep:settings.tipSweep},"byajax");

					//方法里的优先级要高;
					//有undefined情况;
					if(sync){
						ajaxsetup.async=false;
					}else if(sync===false){
						ajaxsetup.async=true;
					}
					
					if(ajaxsetup.success){
						var temp_suc=ajaxsetup.success;
						ajaxsetup.success=function(data){
							settings.callback && settings.callback(data);
							curform[0].validform_ajax=null;
							if($.trim(data.status)==="y"){
								curform[0].validform_status="posted";
							}else{
								curform[0].validform_status="normal";
							}
							
							temp_suc(data,curform);
						}
					}
					
					if(ajaxsetup.error){
						var temp_err=ajaxsetup.error;
						ajaxsetup.error=function(data){
							settings.callback && settings.callback(data);
							curform[0].validform_status="normal";
							curform[0].validform_ajax=null;
							
							temp_err(data,curform);
						}	
					}
					
					var localconfig={
						type: "POST",
						async:true,
						data: curform.serializeArray(),
						success: function(data){
							if($.trim(data.status)==="y"){
								//成功提交;
								curform[0].validform_status="posted";
								Validform.util.showmsg.call(curform,data.info,settings.tiptype,{obj:curform,type:2,sweep:settings.tipSweep},"byajax");
							}else{
								//提交出错;
								curform[0].validform_status="normal";
								Validform.util.showmsg.call(curform,data.info,settings.tiptype,{obj:curform,type:3,sweep:settings.tipSweep},"byajax");
							}
							
							settings.callback && settings.callback(data);
							curform[0].validform_ajax=null;
						},
						error: function(data){
							var msg="status: "+data.status+"; statusText: "+data.statusText;
									
							Validform.util.showmsg.call(curform,msg,settings.tiptype,{obj:curform,type:3,sweep:settings.tipSweep},"byajax");
							
							settings.callback && settings.callback(data);
							curform[0].validform_status="normal";
							curform[0].validform_ajax=null;
						}
					}
					
					ajaxsetup=$.extend({},localconfig,ajaxsetup,{dataType:"json"});
					
					curform[0].validform_ajax=$.ajax(ajaxsetup);

				}else{
					if(!settings.postonce){
						curform[0].validform_status="normal";
					}
					
					var url=url || settings.url;
					if(url){
						curform.attr("action",url);
					}
					
					return settings.callback && settings.callback(curform);
				}
			}
			
			return false;
			
		},
		
		resetForm:function(){
			var brothers=this;
			brothers.each(function(){
				this.reset && this.reset();
				this.validform_status="normal";
			});
			
			brothers.find(".Validform_right").text("");
			brothers.find(".passwordStrength").children().removeClass("bgStrength");
			brothers.find(".Validform_checktip").removeClass("Validform_wrong Validform_right Validform_loading");
			brothers.find(".Validform_error").removeClass("Validform_error");
			brothers.find("[datatype]").removeData("cked").removeData("dataIgnore").each(function(){
				this.validform_lastval=null;
			});
			brothers.eq(0).find("input:first").focus();
		},
		
		abort:function(){
			if(this.validform_ajax){
				this.validform_ajax.abort();	
			}
		}
		
	}
	
	$.Datatype=Validform.util.dataType;
	
	Validform.prototype={
		dataType:Validform.util.dataType,
		
		eq:function(n){
			var obj=this;
			
			if(n>=obj.forms.length){
				return null;	
			}
			
			if(!(n in obj.objects)){
				obj.objects[n]=new Validform($(obj.forms[n]).get(),{},true);
			}
			
			return obj.objects[n];

		},
		
		resetStatus:function(){
			var obj=this;
			$(obj.forms).each(function(){
				this.validform_status="normal";	
			});
			
			return this;
		},
		
		setStatus:function(status){
			var obj=this;
			$(obj.forms).each(function(){
				this.validform_status=status || "posting";	
			});
			
			return this;
		},
		
		getStatus:function(){
			var obj=this;
			var status=$(obj.forms)[0].validform_status;
			
			return status;
		},
		
		ignore:function(selector){
			var obj=this;
			var selector=selector || "[datatype]"
			
			$(obj.forms).find(selector).each(function(){
				$(this).data("dataIgnore","dataIgnore").removeClass("Validform_error");
			});
			
			return this;
		},
		
		unignore:function(selector){
			var obj=this;
			var selector=selector || "[datatype]"
			
			$(obj.forms).find(selector).each(function(){
				$(this).removeData("dataIgnore");
			});
			
			return this;
		},
		
		addRule:function(rule){
			/*
				rule => [{
					ele:"#id",
					datatype:"*",
					errormsg:"出错提示文字！",
					nullmsg:"为空时的提示文字！",
					tip:"默认显示的提示文字",
					altercss:"gray",
					ignore:"ignore",
					ajaxurl:"valid.php",
					recheck:"password",
					plugin:"passwordStrength"
				},{},{},...]
			*/
			var obj=this;
			var rule=rule || [];
			
			for(var index=0; index<rule.length; index++){
				var o=$(obj.forms).find(rule[index].ele);
				for(var attr in rule[index]){
					attr !=="ele" && o.attr(attr,rule[index][attr]);
				}
			}
			
			$(obj.forms).each(function(){
				var $this=$(this);
				Validform.util.enhance.call($this,this.settings.tiptype,this.settings.usePlugin,this.settings.tipSweep,"addRule");
			});
			
			return this;
		},
		
		ajaxPost:function(flag,sync,url){
			var obj=this;
			
			$(obj.forms).each(function(){
				//创建pop box;
				if( this.settings.tiptype==1 || this.settings.tiptype==2 || this.settings.tiptype==3 ){
					creatMsgbox();
				}
				
				Validform.util.submitForm.call($(obj.forms[0]),this.settings,flag,url,"ajaxPost",sync);
			});
			
			return this;
		},
		
		submitForm:function(flag,url){
			/*flag===true时不做验证直接提交*/
			

			var obj=this;
			
			$(obj.forms).each(function(){
				var subflag=Validform.util.submitForm.call($(this),this.settings,flag,url);
				subflag === undef && (subflag=true);
				if(subflag===true){
					this.submit();
				}
			});
			
			return this;
		},
		
		resetForm:function(){
			var obj=this;
			Validform.util.resetForm.call($(obj.forms));
			
			return this;
		},
		
		abort:function(){
			var obj=this;
			$(obj.forms).each(function(){
				Validform.util.abort.call(this);
			});
			
			return this;
		},
		
		check:function(bool,selector){
			/*
				bool：传入true，只检测不显示提示信息;
			*/
			
			var selector=selector || "[datatype]",
				obj=this,
				curform=$(obj.forms),
				flag=true;
			
			curform.find(selector).each(function(){
				Validform.util.check.call(this,curform,"",bool) || (flag=false);
			});
			
			return flag;
		},
		
		config:function(setup){
		/*
			config={
				url:"ajaxpost.php",//指定了url后，数据会提交到这个地址;
				ajaxurl:{
					timeout:1000,
					...
				},
				ajaxpost:{
					timeout:1000,
					...
				}
			}
		*/
			var obj=this;
			setup=setup || {};
			$(obj.forms).each(function(){
				var $this=$(this);
				this.settings=$.extend(true,this.settings,setup);
				Validform.util.enhance.call($this,this.settings.tiptype,this.settings.usePlugin,this.settings.tipSweep);
			});
			
			return this;
		}
	}

	$.fn.validate=function(settings){
		return new Validform(this,settings);
	};
	
	function setCenter(obj,time){
		var left=($(window).width()-obj.outerWidth())/2,
			top=($(window).height()-obj.outerHeight())/2,
			
		top=(document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop)+(top>0?top:0);

		obj.css({
			left:left
		}).animate({
			top : top
		},{ duration:time , queue:false });
	}
	
	function creatMsgbox(){
		if($("#Validform_msg").length!==0){return false;}
		msgobj=$('<div id="Validform_msg"><div class="Validform_title">'+tipmsg.tit+'<a class="Validform_close" href="javascript:void(0);">&chi;</a></div><div class="Validform_info"></div><div class="iframe"><iframe frameborder="0" scrolling="no" height="100%" width="100%"></iframe></div></div>').appendTo("body");//提示信息框;
		msgobj.find("a.Validform_close").click(function(){
			msgobj.hide();
			msghidden=true;
			if(errorobj){
				errorobj.focus().addClass("Validform_error");
			}
			return false;
		}).focus(function(){this.blur();});

		$(window).bind("scroll resize",function(){
			!msghidden && setCenter(msgobj,400);
		});
	};
	
	//公用方法显示&关闭信息提示框;
	$.Showmsg=function(msg){
		creatMsgbox();
		Validform.util.showmsg.call(win,msg,1,{});
	};
	
	$.Hidemsg=function(){
		msgobj.hide();
		msghidden=true;
	};
	
})(jQuery,window);