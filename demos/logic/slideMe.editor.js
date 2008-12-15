/**
 * TOFIX: 
 * * on background image, we should prevent mousedown to bubble, to avoid pseudo-drag in firefox
 * * in ff, dragging element lag when they go out of their container. A solution could be to append them temporarily to the body when dragged, 
 * and append them back to the slide when unselected.
 * 
 * Almost all elements need to be wrapped before being editable:
 * * images because resizable need a wrapper on element without child
 * * text because on click we are supposed to make them resizable/draggable 
 * and on dblclick we should destroy resizable/draggable, wrap the text with an iframe and make the iframe resizable/draggable
 * => instead we wrap it and make the wraper resizable/draggable once for all
 * 
 * Wrapping all element forever, pros & cons:
 * * wrapping and unwrapping elements on each click is not performant
 * * but removing wrapper is maybe more efficient than destroying resizable/draggable
 * TODO: check that this doesn't leak memory.
 * * the fewer elements, the faster the page is rendered on presentation opening
 * * maybe some animations will require less ressources with less elements
 * * the fewer elements, the lighter the presentation
 * * if not wrapped, the element are in absolute position, and when set to contenteditable, firefox use its native draggable/resizable features
 * => the $currElem can be set to position:relative as long as it is wrapped.
 * About removing the iframe when text elment not editabletext:
 * * Animations on text element is too complicated when they are inside an iframe
 * * the iframe should never be destroyed, otherwise we could loose the undo/redo history
 * => we should hide the iframe when not needed
 * TODO: we need to know when the iframe adds new undo in its history
 * 
 * 
 * 
 */
(function($){	
	$.fn.editable = function(){
		return this.each(function(){
			var $this = $(this),
				// The element currently being edited 
				$currElem,
				// The wrapper temporarily added to $currElem
				$currWrap,
				// whether the element is a text or not
				isText,
				actions = new function() {
					var stack = [], cursor = -1,  // cached for performance
					length = 0;
					
					this.start = function(elem, props, end){
						// Only start a new action when the last one is finished
						if (cursor == -1 || stack[cursor].endProps) {
							// Delete all actions that happened after the current one
							if (length != cursor + 1) {
								stack = stack.slice(0, cursor +1);
								length = cursor + 1;
							}
							// And add the new action
							stack[++cursor] = new action(elem, props, end);
							length++;
						}
					};
					this.end = function(props){
						// check that the element has realy been modified
						for (var i in props) 
							if (props[i] != stack[cursor].startProps[i]) 
								stack[cursor].endProps = props;
						// If nothing has changed, cancel this action
						if (!stack[cursor].endProps) {
							cursor--;
							length--;
							stack.pop();							
						}
					};
					this.undo = function(){
						if (cursor >= 0) {
							// If it's a text change, we should use native undo
							if (stack[cursor].endProps === true) {
							
							}
							else 
								(stack[cursor].elem.css('position') == 'relative'? $currWrap : stack[cursor].elem)
									.css(stack[cursor].startProps);
							cursor--;
						}
					};
					this.redo = function(){
						if (cursor < length - 1) {
							cursor++;
							// If it's a text change, we should use native redo
							if (stack[cursor].endProps === true) {
							
							}
							else 
								(stack[cursor].elem.css('position') == 'relative'? $currWrap : stack[cursor].elem)
									.css(stack[cursor].endProps);
						}
					};
				};
				
			function action(elem, props, end) {
				this.elem = elem;
				this.startProps = props;
				this.endProps = end || false;
			}
			
			$this.click(function(e){
				var elem = e.target, elemId;
				// Make sure we are not dealing with a handle
				if (e.target.className.search('-knob') == -1) {
					// Search for the id of clicked element
					do {
						elemId = elem.id ? elem.id.match(/^sldm-.*?-e(\d*)/) : false;
						elem = elem.parentNode;
					// if this produces lags, we should stop the loop when elem is a slide
					}
					while (!elemId && elem)
					// Skip this if currElem is clicked again
					if (!(elemId && $currElem && $currElem.attr('id') == elemId[0])) {
						// Clean previous element
						if ($currElem) {
							// unwrap
							$currElem.insertAfter($currWrap).css({
								width: $currWrap.css('width'),
								height: $currWrap.css('height'),
								top: $currWrap.css('top'),
								left: $currWrap.css('left'),								
								position: 'absolute',
								// standard solution
								//outline: 'none',
								// IE fix
								border: 0,
								margin: 0
							});
							// should be faster than destroying draggable/resizable, but could introduce memory leaks
							$currWrap.remove();
							// If we remove it, midas's draggable/resizable appears again
							if($currElem.attr('contenteditable'))
								$currElem.attr('contenteditable', false)
							$currElem = false;							
						}
						if (elemId) {
							$currElem = $('#' + elemId[0]);
							// TODO: test if it's more performant of setting inline style instead of using the .css()
							$currWrap = $currElem.wrap($('<div style="position:absolute"></div>').css({
								width: $currElem.css('width'),
								height: $currElem.css('height'),
								top: $currElem.css('top'),
								left: $currElem.css('left'),
								margin: '-2%',
								padding: '2%',
								cursor: 'move',
								// TOFIX: only IE need this transparent background image to allow draggable
								background: 'url(layout/tpix.gif)'
							})).css({
								position: 'relative',
								width: '100%',
								height: '100%',
								top: 0,
								left: 0,
								cursor: 'auto',
								// Standard solution
								//outline: '1px solid #DADADA',
								// IE don't know outline
								border: "1px solid #DADADA",
								margin: "-1px",
								outline: "none"
							}).parent().resizable({
								handles: "nw,ne,se,sw",
								knobHandles: true,
								externalKnob: false,
								start: function(){
									// Send start dimensions and positions to action collector
									actions.start($currElem, {
										width: $currWrap.css('width'),
										height: $currWrap.css('height'),
										top: $currWrap.css('top'),
										left: $currWrap.css('left')
									});
								},
								stop: function(){
									var props = {};
									// Convert both position and dimensions to em (125 instead of: 100 * elem width / (slide width = presentation width * 80%)
									props.width = Math.round(125 * parseInt($currWrap.css('width')) / parseInt($this.width())) + '%';
									props.height = Math.round(125 * parseInt($currWrap.css('height')) / parseInt($this.height())) + '%';
									props.left = Math.round(125 * parseInt($currWrap.css('left')) / parseInt($this.width())) + '%';
									props.top = Math.round(125 * parseInt($currWrap.css('top')) / parseInt($this.height())) + '%';
									$currWrap.css(props);
									// Send stop dimensions to action collector
									actions.end(props);
								}
							}).draggable({
								cancel: 'h1,p',
								start: function(){
									// Send start position to action collector
									actions.start($currElem, {
										top: $currWrap.css('top'),
										left: $currWrap.css('left')
									});
								},
								stop: function(){
									var props = {};
									// Convert position to em
									props.left = Math.round(125 * parseInt($currWrap.css('left')) / parseInt($this.width())) + '%';
									props.top = Math.round(125 * parseInt($currWrap.css('top')) / parseInt($this.height())) + '%';
									$currWrap.css(props);
									// Send stop position to action collector
									actions.end(props);
								}
							});
							// Makes text elements contenteditable
							if ($currElem.attr('class').search(/sldmFont/) != -1) {
								$currElem.attr('contenteditable', true).focus()
								.change(function(e) {
									console.log(e)
									console.log('change')
								});								
								// TOFIX: move to $presentation.keypress() ?
								// Fix new node creation inside headings elements
								if ($currElem[0].nodeName.search(/^h/i) != -1)
									$currWrap.keypress(function(e) {
										if(e.keyCode == 13) {
											document.execCommand('inserthtml', false, '<br/>');
											return false;
										}
									});
							}
						}						
					}					
				}
				
			}).keypress(function(e) {
				
				
			}).bind('undo', function() {
				actions.undo();
				
			}).bind('redo', function() {
				actions.redo();
				
			});
		})
	}
})(jQuery);