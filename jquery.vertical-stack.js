/*!
 * Author: Mathieu Bouchard
 * Keywords: javascript,jquery,fixed,stack,scroll
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/matb33/jquery-vertical-stack
 */
(function ($) {
	var isComputedStyleBuggy = false;

	$.fn.verticalStack = function (options) {
		var settings = $.extend(true, {
			enabledClass: "vstack-enabled",
			stackedClass: "vstack-stacked",
			placeholderClass: "vstack-placeholder",
			dataAttribute: "data-vstack",
			removeIDAttributeFromPlaceholder: true
		}, options);

		var main = function () {
			var $viewport = $(this);

			// Get all items that are to be looked after by our plugin
			var $items = $("[" + settings.dataAttribute + "]");

			// Add enabled class to all of these items
			if (settings.enabledClass !== "") {
				$items.addClass(settings.enabledClass);
			}

			// Watch the viewport scrolling
			var onScroll = function () {
				// Iterate through each of our items, check for crossings
				$items.vs_checkCrossings($viewport);
			};

			var onResize = function () {
				// Iterate through each of our items, refresh crossings
				$items.each(function (index, item) {
					var $item = $(item);
					$item.vs_releaseItem();
					$item.vs_checkCrossings($viewport);
				});
			};

			$viewport.bind("scroll", onScroll);
			$viewport.bind("resize", onResize);

			$(document).ready(function () {
				window.setTimeout(onScroll, 500);
			});
		};

		$.fn.vs_checkCrossings = function ($viewport) {
			this.each(function (index, item) {
				var $item = $(item);
				var $placeholder = $item.data("placeholder");

				// Verify that we aren't in crossed-mode already
				if ($placeholder === undefined) {
					$item.vs_checkForFreeze($viewport);
				} else {
					$item.vs_checkForRelease();
				}
			});

			return this;
		};

		$.fn.vs_checkForFreeze = function ($viewport) {
			this.each(function (index, item) {
				var $item = $(item);
				var correctedCoords;

				// Capture the dimensional properties of the item
				var itemDimProp = $item.vs_getDimensionalProperties($viewport);

				// Grab the items with which this item is set to detect collisions
				var otherItemsSelector = $item.attr(settings.dataAttribute);
				var $otherItems = otherItemsSelector !== "" ? $(otherItemsSelector) : $("body");

				// Make sure to exclude placeholders
				$otherItems = $otherItems.not("." + settings.placeholderClass);

				var tallestY = null;
				var $crossedItem = null;
				var crossedItemDimProp = null;

				// Iterate over the other items and check for a crossing (a loose form of collision)
				$otherItems.not($item).each(function (otherIndex, otherItem) {
					var $otherItem = $(otherItem);

					// Capture the dimensional properties of this other item
					var otherItemDimProp = $otherItem.vs_getDimensionalProperties($viewport);

					// Determine if the item is overlapping or gone beyond the other item (crossed it)
					if (hasCrossed(itemDimProp.coords, otherItemDimProp.coords)) {
						// Since we can have multiple other items to cross against, pick the one
						// that reaches the furthest down
						if (tallestY === null || otherItemDimProp.coords.y2 > tallestY) {
							tallestY = otherItemDimProp.coords.y2;
							$crossedItem = $otherItem;
							crossedItemDimProp = otherItemDimProp;
						}
					}
				});

				// We've determined the most accurate crossed item
				if ($crossedItem !== null) {
					$item.vs_freezeItem($viewport, itemDimProp, crossedItemDimProp);
				}
			});

			return this;
		};

		$.fn.vs_checkForRelease = function () {
			this.each(function (index, item) {
				// Already in crossed-mode (blocked), check to see if we can be released
				var $item = $(item);
				var $placeholder = $item.data("placeholder");

				if ($placeholder !== undefined) {
					var itemCanBeReleased = $item.offset().top < $placeholder.offset().top;

					if (itemCanBeReleased) {
						// Release the item back to the normal page flow
						$item.vs_releaseItem();
					}
				}
			});

			return this;
		};

		$.fn.vs_freezeItem = function ($viewport, itemDimProp, crossedItemDimProp) {
			this.each(function (index, item) {
				var $item = $(item);
				var $placeholder;

				// Drop a placeholder item to take up the space it used to take up,
				// since position:fixed will cause the element to be taken out of the
				// normal flow of the page
				$placeholder = $item.clone();
				$placeholder.addClass(settings.placeholderClass);
				$placeholder.removeClass(settings.enabledClass);
				$placeholder.removeClass(settings.stackedClass);
				$placeholder.removeAttr(settings.dataAttribute);
				$placeholder.css("visibility", "hidden");

				if (settings.removeIDAttributeFromPlaceholder) {
					$placeholder.removeAttr("id");
				}

				// Compute the correct coords as to be flush against the bottom of the crossed item
				correctedCoords = correctCrossingCoords(itemDimProp.coords, crossedItemDimProp.coords);

				// Freeze the item's position, using corrected coords
				$item.data("placeholder", $placeholder);
				$item.css("position", "fixed");
				$item.vs_viewportOffset({
					top: correctedCoords.y1,
					left: correctedCoords.x1
				}, $viewport);
				$item.width(itemDimProp.width);
				$item.height(itemDimProp.height);

				if (settings.stackedClass !== "") {
					$item.addClass(settings.stackedClass);
				}

				$placeholder.insertBefore($item);
			});

			return this;
		};

		$.fn.vs_releaseItem = function () {
			this.each(function (index, item) {
				var $item = $(item);
				var $placeholder = $item.data("placeholder");

				if ($placeholder !== undefined) {
					$item.css("position", $placeholder.css("position"));
					item.style.top = "";
					item.style.left = "";
					$item.removeData("placeholder");

					if (settings.stackedClass !== "") {
						$item.removeClass(settings.stackedClass);
					}

					// Remove the unneeded placeholder
					$placeholder.remove();
				}
			});

			return this;
		};

		$.fn.vs_viewportOffset = function (param1, param2) {
			var $viewport;
			var coords;
			var mode;
			var $element;
			var elementCssPosition;
			var offset;
			var top;
			var left;

			if (param1 && typeof param1 === "object" && (param1.hasOwnProperty("top") || param1.hasOwnProperty("left"))) {
				// Act as a setter, where:
				// param1 is the coords
				// param2 is the viewport
				mode = 0;
				coords = param1;
				$viewport = param2;
			} else {
				// Act as a getter, where:
				// param1 is the viewport
				mode = 1;
				$viewport = param1;
			}

			if ($viewport === undefined) $viewport = $(window);
			if (coords === undefined) coords = {
				top: 0,
				left: 0
			};
			if (mode === undefined) mode = 1;

			$element = $(this);
			elementCssPosition = $element.css("position");

			if (mode === 0) {
				// Setter
				top = coords.top;
				left = coords.left;
				if (isComputedStyleBuggy) {
					top = top + $viewport.scrollTop();
					left = left + $viewport.scrollLeft();
				}
				return $element.offset({top: top, left: left});
			} else {
				// Getter
				offset = $element.offset();
				top = offset.top - $viewport.scrollTop();
				left = offset.left - $viewport.scrollLeft();

				return {
					top: top,
					left: left
				};
			}
		};

		$.fn.vs_getDimensionalProperties = function ($viewport) {
			var $element = $(this);
			var offset, width, height, coords;

			if ($element.prop("nodeName").toLowerCase() === "body") {
				// Special handling for body. We simulate a rect of 100px height spanning
				// the entire width, placed above the viewport
				offset = {
					top: -100,
					left: 0
				};
				width = $viewport.width();
				height = 100;
				coords = {
					x1: offset.left,
					y1: offset.top,
					x2: offset.left + width,
					y2: offset.top + height
				};
			} else {
				offset = $element.vs_viewportOffset($viewport);
				width = $element.width();
				height = $element.height();
				coords = {
					x1: offset.left,
					y1: offset.top,
					x2: offset.left + $element.outerWidth(),
					y2: offset.top + $element.outerHeight()
				};
			}

			return {
				offset: offset,
				width: width,
				height: height,
				coords: coords
			};
		};

		detectGetComputedStyleBug(function (isBuggy) {
			isComputedStyleBuggy = isBuggy;
			this.each(main);
		}.bind(this));

		return this;
	};

	var hasCrossed = function (rectA, rectB) {
		// Assumes that we're asking if rectA has "crossed" rectB
		return (rectA.y1 < rectB.y2);
	};

	var correctCrossingCoords = function (rectA, rectB) {
		// Assumes that rectB is authoritative, i.e. the returned rect is a correction of rectA, where rectB remains fixed.
		var rectC = {
			x1: rectA.x1,
			y1: rectA.y1,
			x2: rectA.x2,
			y2: rectA.y2
		};

		if (rectA.y1 < rectB.y2) {
			var diff = rectB.y2 - rectA.y1;
			rectC.y1 += diff;
			rectC.y2 += diff;
		}

		return rectC;
	};

	var detectGetComputedStyleBug = function (callback) {
		// Attempt at detecting a possible bug in certain browsers (currently only Firefox).
		// Calling getComputedStyle.getPropertyValue on a fixed element that has never had top/left set beforehand
		// should return auto for top/left, but instead returns pixel positions.
		$(document).ready(function () {
			var $div = $("<div style='position:fixed;' />");
			var div = $div.get(0);
			$div.prependTo("body");
			var top = div.ownerDocument.defaultView.getComputedStyle(div, null).getPropertyValue("top");
			$div.remove();
			callback(top !== "auto");
		});
	};

})(window.jQuery);
