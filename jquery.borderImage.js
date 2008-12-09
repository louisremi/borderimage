(function($){

// snif browser capabilities
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
	bicanvas.setAttribute('height', '30px');
} else {
	cap = 'vml';
	if (!document.namespaces['biv']) {
		document.namespaces.add('biv', 'urn:schemas-microsoft-com:vml', "#default#VML");
	}
	if (!document.styleSheets['borderImage']) {
        document.createStyleSheet().addRule('biv\\:*', "behavior: url(#default#VML);");
	}
}
	
$.fn.borderImage = function(value){	
	// Use browsers native implemantation when available
	if(/^-/.test(cap))
		return $(this).css(cap+'BorderImage', value).css('backgroundColor', 'none');
		
	var result;
	if(result = /url\(\s*"(([\w-]*).*?)"\s*\)\s*(\d+)(%)?(?:px)?\s*(\d*)(%)?(?:px)?\s*(\d*)(%)?(?:px)?\s*(\d*)(%)?(?:px)?/.exec(value)) {		
		// First load the image
		$('body').prepend('<img id="'+result[2]+'" src="'+result[1]+'" style="position:absolute; visibility:hidden" />');
		
		var _this = this,
			$img = $('#'+result[2]).load(function(){
			// Convert all % cut
			var imgHeight 	= $img.height(),
				imgWidth	= $img.width(),
				topCut 		= parseInt(result[3]) * (result[4]? imgHeight/100 : 1),
				rightCut 	= result[5]? parseInt(result[5]) * (result[6]? imgWidth/100 : 1) : topCut,
				bottomCut 	= result[7]? parseInt(result[7]) * (result[8]? imgHeight/100 : 1) : topCut,
				leftCut		= result[9]? parseInt(result[9]) * (result[10]? imgWidth/100 : 1) : rightCut,
				centerHeight= imgHeight -topCut -bottomCut,
				centerWidth	= imgWidth -leftCut -rightCut,
				imgs = [$img[0]],
				// Draw all the slices
				slice0 = drawSlice(0, 					0, 						leftCut, 		topCut, 		imgs),
				slice1 = drawSlice(leftCut, 			0, 						centerWidth,	topCut, 		imgs),
				slice2 = drawSlice(leftCut+centerWidth,	0, 						rightCut, 		topCut,			imgs),
				slice3 = drawSlice(0, 					topCut, 				leftCut, 		centerHeight,	imgs),
				slice4 = drawSlice(leftCut, 			topCut, 				centerWidth,	centerHeight,	imgs),
				slice5 = drawSlice(leftCut+centerWidth,	topCut,					rightCut, 		centerHeight,	imgs),
				slice6 = drawSlice(0, 					topCut+centerHeight,	leftCut, 		bottomCut,		imgs),
				slice7 = drawSlice(leftCut,				topCut+centerHeight,	centerWidth,	bottomCut,		imgs),
				slice8 = drawSlice(leftCut+centerWidth,	topCut+centerHeight,	rightCut, 		bottomCut,		imgs),
				borderTop, borderRight, borderBottom, borderLeft,
				prevFragment;
				
			function drawSlice(sx, sy, sw, sh, imgs) {
				var slice = document.createDocumentFragment();
				for(var i = 0; i < imgs.length; ++i) {
					if(cap == 'canvas') {
						var el = document.createElement('img');
						// Clear the global canvas and use it to draw a new slice
						bicanvas.setAttribute('width', '30px');
						bicanvas.getContext('2d').drawImage(imgs[i], sx, sy, sw, sh, 0, 0, 30, 30);
						// Store the slice in an image in order to reuse it
						el.src = bicanvas.toDataURL();						
					} else {
						// Could you explain me why we can't just use "document.createElement('biv:image')"?
						var el = document.createElement('div');
						el.insertAdjacentHTML('BeforeEnd', 
							'<biv:image src="'+imgs[i].src+'" cropleft="'+sx/imgWidth+'" croptop="'+sy/imgHeight+'" cropright="'+(imgWidth-sw-sx)/imgWidth+'" cropbottom="'+(imgHeight-sh-sy)/imgHeight+'" />'
						);
						el = el.firstChild;
					}
					el.style.width = el.style.height = '100%';
					el.style.position = 'absolute';
					el.className = 'type'+i;
					slice.appendChild(el);
				}
				return slice;
			}
			
			_this.each(function(i, el){
				var $this = $(el),
					thisStyle = {
						position: 'relative',
						borderColor: 'transparent',
						background: 'none'
					},
					reuse = true;
					
				// Fix various MSIE6 bugs
				if($.browser.msie && parseInt($.browser.version) < 7){
					thisStyle.borderColor = '#808180';
					thisStyle.filter = 'chroma(color=#808180)';
					if($this.css('display') == 'inline')
						thisStyle.display = 'inline-block';
				}
				
				$this.css(thisStyle);
				
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
						var el = document.createElement('div');
						for(var i in style)
							el.style[i] = style[i];
						el.style.position = 'absolute';
						el.appendChild(slice.cloneNode(true));
						fragment.appendChild(el);
					}
					
					// Create the magical tiles
					drawBorder({top:'-'+borderTop, left:'-'+borderLeft, height: borderTop, width: borderLeft}, 				slice0);
					drawBorder({top:'-'+borderTop, left: 0, width: '100%', height: borderTop, zIndex: -1}, 					slice1);
					drawBorder({top:'-'+borderTop, right:'-'+borderRight, height: borderTop, width: borderRight}, 			slice2);									
					drawBorder({top: 0, bottom:0, left:'-'+borderLeft, width: borderLeft, height: '100%'}, 					slice3);					
					drawBorder({left: 0, top: 0, right: 0, bottom: 0, height: '100%', width: '100%', zIndex: -1},			slice4);
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
		if(cap != 'canvas') $(this)[0].appendChild(document.createElement('biv:image'));
	}
	return $(this);	
};
})(jQuery);