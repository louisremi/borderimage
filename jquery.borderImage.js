(function($){
/*
 * jquery.borderImage - cross-browser implementation of CSS3's borderImage property
 *
 * Copyright (c) 2008 lrbabe (/ɛlɛʁbab/ lrbabe.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

/* TODO:
 * - Empty elements (img, canvas, ...) can't use borderImage without beeing wrapped first.
 */


// Snif browser capabilities.
var cap;
// WebKit 525+ (and probably earlier) and Gecko 1.9.1+ can handle borderImage properly.
// We could be smarter and avoid using evil browser sniffing to detect if borderImage is implemented 
// but it would involve a lot of processing, as safari 3.1 and chrome 0.4 still don't answer to .css('-webkitBorderImage')
// Anyway we need to know which vendor prefix to use.
if($.browser.mozilla && /^(1\.9\.[^0]|[^01])/.test($.browser.version))
	cap = '-moz';
else if($.browser.safari && parseInt($.browser.version) >= 525)
	cap = '-webkit';
else if(document.createElement('canvas').getContext) {
	cap = 'canvas';
	// Create a global canvas that will be used to draw the slices.
	bicanvas = document.createElement('canvas');
} else {
	cap = 'vml';
	if (!document.namespaces['biv']) {
		document.namespaces.add('biv', 'urn:schemas-microsoft-com:vml', "#default#VML");
		document.createStyleSheet().addRule('biv\\:*', "behavior: url(#default#VML);");
	}
}
	
$.fn.borderImage = function(value){
	// Use browsers native implemantation when available.
	if(/^-/.test(cap))
		// For single borderImage only
		return (arguments[1] && arguments[1].constructor == String)? $(this) : $(this).css(cap+'BorderImage', value).css('backgroundColor', 'transparent');
	
	var result;
  	if(result = /url\(\s*"(.*?)"\s*\)\s*(\d+)(%)?\s*(\d*)(%)?\s*(\d*)(%)?\s*(\d*)(%)?/.exec(value)) {    
        
		arguments[0] = result[1];
	    var _this = this,
	      imageWrapper = document.createDocumentFragment().appendChild(document.createElement('div')),
	      argsLength = arguments.length,
	      // Use the last argument as resolution if it is a number, otherwise use defaults.
	      resolution = arguments[argsLength -1].constructor == Number? arguments[argsLength -1] : $.fn.borderImage.defaults.resolution;
	    for(var i = 0; i < argsLength && arguments[i].constructor == String; ++i){
	    	var img = document.createElement('img');
	      	img.src = arguments[i];
			// If we don't clone the image, load event may not fire in IE
	      	imageWrapper.appendChild(img.cloneNode(true));
	    }
	    imageWrapper.style.position = 'absolute';
	    imageWrapper.style.visibility = 'hidden';
	    $('body').prepend(imageWrapper);
    
    	var $img = $('img:first', imageWrapper).load(function(){
			// Compute cuts
			var imgHeight 	= $img.height(),
				imgWidth	= $img.width(),
				topCut 		= parseInt(result[2]) * (result[3]? imgHeight/100 : 1),
				rightCut 	= result[4]? parseInt(result[4]) * (result[5]? imgWidth/100 : 1) : topCut,
				bottomCut 	= result[6]? parseInt(result[6]) * (result[7]? imgHeight/100 : 1) : topCut,
				leftCut		= result[8]? parseInt(result[8]) * (result[9]? imgWidth/100 : 1) : rightCut,
				centerHeight= imgHeight -topCut -bottomCut,
				centerWidth	= imgWidth -leftCut -rightCut,
				image = imageWrapper.getElementsByTagName('img'),
				// Draw all the slices
				slice0 = drawSlice(0, 					0, 						leftCut, 		topCut, 		image),
				slice1 = drawSlice(leftCut, 			0, 						centerWidth,	topCut, 		image),
				slice2 = drawSlice(leftCut+centerWidth,	0, 						rightCut, 		topCut,			image),
				slice3 = drawSlice(0, 					topCut, 				leftCut, 		centerHeight,	image),
				slice4 = drawSlice(leftCut, 			topCut, 				centerWidth,	centerHeight,	image),
				slice5 = drawSlice(leftCut+centerWidth,	topCut,					rightCut, 		centerHeight,	image),
				slice6 = drawSlice(0, 					topCut+centerHeight,	leftCut, 		bottomCut,		image),
				slice7 = drawSlice(leftCut,				topCut+centerHeight,	centerWidth,	bottomCut,		image),
				slice8 = drawSlice(leftCut+centerWidth,	topCut+centerHeight,	rightCut, 		bottomCut,		image),
				borderTop, borderRight, borderBottom, borderLeft,
				prevFragment;
				
			function drawSlice(sx, sy, sw, sh, image) {
				var slice = document.createDocumentFragment();
				// Don't waste time drawing slice with null dimension
				if(sw > 0 && sh > 0) {
					if(cap == 'canvas') bicanvas.setAttribute('height', resolution+'px');				
					for(var i = 0; i < image.length; ++i) {
						if(cap == 'canvas') {
							// Clear the global canvas and use it to draw a new slice
							bicanvas.setAttribute('width', resolution+'px');
							bicanvas.getContext('2d').drawImage(image[i], sx, sy, sw, sh, 0, 0, resolution, resolution);
							// Store the slice in an image in order to reuse it
							var el = document.createElement('img');
							el.src = bicanvas.toDataURL();
						} else {
							// Could you explain me why we can't just use "document.createElement('biv:image')"?
							var el = document.createElement('div');
							el.insertAdjacentHTML('BeforeEnd', 
								'<biv:image src="'+image[i].src+'" cropleft="'+sx/imgWidth+'" croptop="'+sy/imgHeight+'" cropright="'+(imgWidth-sw-sx)/imgWidth+'" cropbottom="'+(imgHeight-sh-sy)/imgHeight+'" />'
							);
							el = el.firstChild;
						}
						el.style.width = el.style.height = '100%';
						el.style.position = 'absolute';
						el.style.border = 'none';
						el.className = 'biSlice image'+i;
						slice.appendChild(el);
					}
				}
				return slice;
			}
			
			_this.each(function(i, el){
				var $this = $(el),
					thisStyle = {
						position: 'relative',
						borderColor: 'transparent',
						background: 'none',
						padding: 0
					},
					innerWrapper = document.createElement('div'),
					reuse = true;
					
				// There is many case where "display: 'inline'" actually is a problem.
				// TODO: Try to find exactly where
				if($this.css('display') == 'inline')
					thisStyle.display = 'inline-block'; 			
					
				// Fix various MSIE6 bugs
				if($.browser.msie && parseInt($.browser.version) < 7){
					thisStyle.borderColor = '#808180';
					thisStyle.filter = 'chroma(color=#808180)';					
				}
				
				innerWrapper.style.paddingTop = $this.css('paddingTop');
				innerWrapper.style.paddingLeft = $this.css('paddingLeft');
				innerWrapper.style.paddingBottom = $this.css('paddingBottom');
				innerWrapper.style.paddingRight = $this.css('paddingRight');
				innerWrapper.style.position = 'relative';
				innerWrapper.className = 'biWrapper'
				$this.css(thisStyle).wrapInner(innerWrapper);
				
				if(borderTop != $this.css('borderTopWidth')) {
					borderTop = $this.css('borderTopWidth');
					reuse = false;
				}
				if(borderBottom != $this.css('borderBottomWidth')) {
					borderBottom = $this.css('borderBottomWidth');
					reuse = false;
				}
				if(borderRight != $this.css('borderRightWidth')) {
					borderRight = $this.css('borderRightWidth');
					reuse = false;
				}
				if(borderLeft != $this.css('borderLeftWidth')) {
					borderLeft = $this.css('borderLeftWidth');
					reuse = false;
				}
				
				// Reuse previous fragment if borderWidths are the same.
				if(!reuse) {
					var fragment = document.createDocumentFragment();
					
					function drawBorder(style, slice) {
						// Don't waste time drawing borders with null dimension
						if(parseInt(style.width) != 0 && parseInt(style.height) != 0) {
							var el = document.createElement('div');
							for(var i in style)
								el.style[i] = style[i];
							el.style.position = 'absolute';
							el.style.textAlign = 'left';
							el.appendChild(slice.cloneNode(true));
							fragment.appendChild(el);
						}						
					}
					
					// Create the magical tiles
					drawBorder({top:'-'+borderTop, left:'-'+borderLeft, height: borderTop, width: borderLeft}, 				slice0);
					drawBorder({top:'-'+borderTop, left: 0, width: '100%', height: borderTop}, 								slice1);
					drawBorder({top:'-'+borderTop, right:'-'+borderRight, height: borderTop, width: borderRight}, 			slice2);									
					drawBorder({top: 0, bottom:0, left:'-'+borderLeft, width: borderLeft, height: '100%'}, 					slice3);					
					drawBorder({left: 0, top: 0, right: 0, bottom: 0, height: '100%', width: '100%'},						slice4);
					drawBorder({top: 0, bottom:0, right:'-'+borderRight, width: borderRight, height: '100%'}, 				slice5);									
					drawBorder({bottom:'-'+borderBottom, left:'-'+borderLeft, width: borderLeft, height: borderBottom},		slice6);
					drawBorder({bottom:'-'+borderBottom, left: 0, width:'100%', height: borderBottom}, 						slice7);
					drawBorder({bottom:'-'+borderBottom, right:'-'+borderRight, height: borderBottom, width: borderRight},	slice8);
					
					prevFragment = fragment;
				}
				$this.prepend(prevFragment.cloneNode(true));
				
				// height: 100% doesn't work in IE6
				if($.browser.msie && parseInt($.browser.version) < 7)
					el.onpropertychange = function(){
						$this.find('div:eq(3), div:eq(4), div:eq(5)').css('height', $this.innerHeight())
					};									
			});
		});
		// Could you explain me why we need that to have all the slices actually drawn...
		if(cap != 'canvas') $('body')[0].appendChild(document.createElement('biv:image'));
	}
	return $(this);	
};

$.fn.borderImage.defaults = {
	resolution: 20
};

/*
 * Helper function to resize an element potentially decorated with an emulated border-image, using an animation.
 */
$.fn.biResize = function(newDimensions) {
	return this.each(function(i, el){
		var $el = $(el),
			$biWrap = $el.find('.biWrapper');
			// If the content is wrapped, it means the browser is emulating borderImage
		    if($biWrap.length) {
		        // transfer dimensions to the internal wrapper
		        $biWrap.css({ width: $el.css('width'), height: $el.css('height') });
		        $el.css({ width: 'auto', height: 'auto' });
		        // Resize the internal wrapper instead
		        $biWrap.animate(newDimensions);
		    // If the native implementation is used, you can resize the element itself
		    } else $el.animate(newDimensions);
	});
}
})(jQuery);