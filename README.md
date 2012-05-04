# jQuery Vertical Stacking plugin for jQuery

Allows elements to stack against each other when scrolling by leveraging `position: fixed`. Useful for complex scenarios involving sticky elements (such as sticky navs). You can have elements stack against each other, while having other elements continue to flow normally.

See this [test page](http://matb33.github.com/jquery-vertical-stack/) for example usage. Peek under the hood by viewing the HTML source. Look for the `data-vstack` attribute (these specify selectors).

## Setting up the stacking elements

Here is a simple self-descriptive example of some markup. The idea is that only the first and last divs will be part of our "stack". When scrolling down, the middle div will disappear underneath the first div and then off-screen. When scrolling back up, all elements will return back to their original positions.

	<body style="min-height: 2000px;">
		<div id="test1" style="margin-bottom: 50px;" data-vstack="body">
			<p>This is an element that will stack against the top of the viewport.</p>
		</div>
		<div id="test2" style="margin-bottom: 50px;">
			<p>This element is 50px below the first element, and will continue to scroll off screen.</p>
		</div>
		<div id="test3" data-vstack="#test1">
			<p>This element is 50px below the second element, but will stack against the first element.</p>
		</div>
	</body>

In this example, I've set the minimum height of the body to 2000px so as to allow us to scroll down and see the stacking effect taking place, despite there being very little content.

The selectors you specify in the `data-vstack` are the elements with which this particular element will "stack" against. The special case of `body` or an empty string means that this element will stack against the top of the viewport.

So to summarize, when scrolling down, the first div (test1) will stack against the top, the second div (test2) will pass underneath test1 and eventually off-screen, and the last div (test3) will stack against test1.

As you scroll back up, the stacking is undone and all elements return to their original positions.

## Activating the plugin

Include the script after you've included jQuery:

	<script type="text/javascript" src="jquery.vertical-stack.js"></script>

On document ready, fire up the plugin, much like any other jQuery plugin:

	jQuery(document).ready(function ($) {
		$(window).verticalStack();
	});

## Configuring the plugin

The plugin does take a few options, but for the most part can be left as-is. They are specified in the standard way for jQuery plugins, which is through a single object:

- `enabledClass`: default is `vstack-enabled`
- `stackedClass`: default is `vstack-stacked`
- `placeholderClass`: default is `vstack-placeholder`
- `dataAttribute`: default is `data-vstack`
- `removeIDAttributeFromPlaceholder`: default is `true`

The various *Class properties are added depending on the current state of each element:

- The value of `enabledClass` is added as a class to each element that has the attribute specified in `dataAttribute` (usually `data-vstack`), as soon as the plugin is activated

- The value of `stackedClass` is added as a class to each element that is currently "stacked", i.e. has switched to `position: fixed` and is stacked up against another element.

- The value of `placeholderClass` is added as a class to each element that has been cloned and put in place of the original element that is now "stacked". This hidden placeholder element is necessary to maintain the placement of neighbouring elements that are still in the normal page flow.

- The value of `dataAttribute` is customizable in case `data-vstack` doesn't float your boat.

- The boolean `removeIDAttributeFromPlaceholder` will remove any id attributes on the placeholder (which clones the element). You really shouldn't have two elements with the same id, even for an invisible placeholder, so this helps keep this clean.

## Enjoy!

Let me know if you use this plug-in! That would help me get motivated to elaborate on the documentation.