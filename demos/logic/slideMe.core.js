/*
 * This file is a set of "classes" extending jQuery
 * The aim is to use jQuery constructor - $('...') - as few as possible
 * - properties are made public using jQuery.data()
 * - there is no method but event instead
 *
 *
 * DOM reference rules:
 * - Only a parent can pass brothers to children
 * - An element can only trigger events on parent, children or brothers provided by the parent
 * - Previous rules may be ignored for $presentation
 *
 * Avantages/Inconvéniants/fausse idées sur cette structure
 * - l'objet jQuery d'un élément est toujours à portée de main. au lieu de faire element.$this on fait $element.
 * - Il suffit de retrouver l'objet jQuery d'un élément pour avoir accès à toutes ces méthodes.
 * Pas besoin de se trimbaler des objets obligatoirement initialisés à l'avance (see jquery.slideMe.js)
 * - C'est très facilement extensible : on bind d'autres évènements à l'élément pour lui rajouter des méthodes, 
 * par contre on n'aura pas accès à ses membres privés (normal, ils ne sont pas protected mais private).
 * 
 * TODO :
 * - find a way to represent element while they are hidden (opacity to O.1, icon on the element, ... ?)
 * 
 * BUG: when cssStore is initialized, the presentation hasn't dimension, all non-percent dimensions are thus wrong.
 */
(function($) {
    $.fn.view = function($navBar, fontCoefs) {
        return this.each(function() {
            var $this = $(this),
                $presentation = $this.children(':first').presentation(fontCoefs),
                $navSlider = $this.children(':last').navSlider($presentation);


            // Set view dimensions to 4/3 and adjust fontSize to view's dimensions
            $this.resize(function(e, duration) {
                var parentWidth = $this.parent().width(),
                    parentHeight = $this.parent().height();
                (parentWidth / parentHeight) > 1.33?
                    $this[duration? 'animate' : 'css']({
                        height: '100%',
                        width: parentHeight * 4/3,
                        fontSize: parentHeight / 3 +'%'
                    }, duration) :
                    $this[duration? 'animate' : 'css']({
                        width: '100%',
                        height: parentWidth * 3/4,
                        fontSize: parentWidth / 4 +'%'
                    }, duration);
                return $this;

            }).bind('toggleNavigation', function() {
                $navBar[$presentation.hasClass('sldmThumbnail')? 'fadeIn' : 'fadeOut']();
                $navSlider.trigger($presentation.hasClass('sldmThumbnail')? 'hide' : 'show');
				
            }).bind('editable', function() {
				$this.after($("<div></div>").load("widgets/editable.htm", function() {
					// Add all features to make the presentation editable
					$presentation.editable();
					// Load the toolbar					
					// Make thumbnail view editable
					// prevent animation to be played
				}));
				// Prepare the presentation to be editable
				$presentation.addClass('sldmEditable').trigger('editable');
				$this.css('overflow', 'visible');
								
			});
        });
    };


    $.fn.presentation = function(fontCoefs) {
        return this.each(function() {
            var $this = $(this)
                    // Hide the magic of initialisation & assign unique id
                    .hide().attr('id', function() {
                        do {
                            var id = 'sldm-p'+ Math.round(Math.random()*100);
                        } while($('#'+id).length);
                        return id;
                    }()),
                // TODO: Regenerate presentation content from persistance
                $slides = $this.children().slide($this.attr('id'), fontCoefs),
                $view = $this.parent(),
                currentSlide = 0,

                transit = function(slideId, aft) {
                    $this.queue(function() {
                        var $slide = $slides.eq(slideId);
                        if(slideId != currentSlide)
                            $slide.trigger('fullsize');
                        // Fade when there is no explicit transition
						var transition = $slide.data('transition')[(slideId == currentSlide && aft) || (slideId != currentSlide && !aft)? 0 : 1] || {effect: "fade"};
                            transition.callback = function() {
                                if(slideId == currentSlide)
                                    $slide.trigger('thumbnailize');
                                $this.dequeue();
                            };
                        $slide.toggle(transition.effect, transition);                        
                    });
                },

                jump = function(target) {
                    if(target >= 0 && target < $slides.length) {
                        // rewind or forward ?
						var aft = target < currentSlide;
						// Execute the transition on the current slide
                        transit(currentSlide, aft);
                        // Update the view
						$this.css({marginTop: -18.75 * target +'%'});
                        // Execute the transition on the target slide
                        transit(target, aft);
                        // Make sure current slide is hidden. TOFIX: usefull ?
                        //$slides.eq(currentSlide).css({display: 'none'});
                        $this.queue(function() {
                            currentSlide = target;
							$this.trigger(aft? 'rewind' : 'forward');							
							$this.dequeue();
                        });
                    }                    
                };


            $this.data('length', $slides.length)
			
			.click(function(e) {
				// Display target slide
                if ($this.hasClass('sldmThumbnail')) {
					var elem = e.target, slideId;
					// Search for the id of clicked slide
					do {
						slideId = elem.id? elem.id.match(/^sldm-.*?-s(\d*)/) : false;
						elem = elem.parentNode;
					} while (!slideId && elem)
					// Back to fullsize
					if (elem) {
                        currentSlide = parseInt(slideId[1]);
						$this.trigger('fullsize', slideId[1]);
						$view.trigger('toggleNavigation');
					}                    
				} else if(!$this.hasClass('sldmEditable'))
					$this.trigger('forward');
					
			}).bind('fullsize', function(e, slideId) {
                $this.animate({marginTop: -18.75 * currentSlide +'%'}, function() { $this.removeClass('sldmThumbnail'); });
                $slides.eq(slideId).trigger('fullsize', function() {                    
                    $slides.not(':eq('+slideId+')').css('display', 'none');
                });

            }).bind('thumbnailize', function() {
                $slides.css({display: 'block'});
                $this.addClass('sldmThumbnail').animate({marginTop: -18.75 * (currentSlide -1) +'%'});
                $slides.eq(currentSlide).trigger('thumbnailize', true);
                
            }).bind('forward', function() {
                $slides.eq(currentSlide).trigger('forward');

            }).bind('rewind', function() {
                $slides.eq(currentSlide).trigger('rewind');

            }).bind('fastforward', function() {
				jump(currentSlide +1);

            }).bind('fastrewind', function() {
                jump(currentSlide -1);

            }).bind('jump', function(e, target) {
                jump(target);
				
            }).bind('editable', function() {
				$slides.eq(currentSlide).trigger('editable');
				
			});

            $slides.eq(0).trigger('fullsize').css('display', 'block');
			$this.css({display: 'block'}).trigger('forward');			
        });
    };

    /*
     * Init sldmSlide
     */
    $.fn.slide = function(parentId, fontCoefs) {
        return this.each(function(i) {
            var $this = $(this).attr('id', parentId+'-s'+i).css({display: 'none'}),
                $presentation = $this.parent(),
                $elements = $this.children('.sldmElement').element($this.attr('id'), fontCoefs),
                // Read inner json
                json = JSON.parse($this.children('script:first').html().replace(/^.*?\{/m, '{')),
                currentAnimation = -1,
                
				
				animate = function(animation, delay, $element) {
					setTimeout(function() {
						// Callback to dequeue element at the end of the animation
	                    animation.o[animation.css? 'complete' : 'callback'] = function() { $element.dequeue(); };
						// Don't queue animation on an element level, we take care of it.
	                    // FIX: it doesn't work for all effects !
	                    animation.o['queue'] = false;
						animation.o['duration'] = animation['o'].duration;
	                    //$element[animation.type == 'animate'? 'effect' : 'toggle'](animation.o['effect'], animation.o);
						$element[animation.type](animation.css || animation.o['effect'], animation.o);
					}, delay);								                    
				},
                
				forwind = function(aft) {
					if(aft && currentAnimation == -1)
						$presentation.trigger('fastrewind');
					else if(!aft && currentAnimation == json.animations.length -1)
						$presentation.trigger('fastforward');
					else $this.queue(function() {
						var anims = json.animations,
							xLength = anims.length,
							x = currentAnimation,
							delay = 0,
							toAdd = 0;
						do {
							if(!aft) x++;
								var $element = $('#'+$this.attr('id')+'-'+anims[x].id),
									animation = anims[x];
								if(animation.trigger == 'after') delay += toAdd;								
								if(!animation.o) animation.o = {};
								animate(animation, animation['o'].delay + delay, $element);
								toAdd = animation['o'].delay + animation['o'].duration;
							if(aft) x--;
						} while(((!aft && x < xLength -1) || (aft && x > -1)) && anims[x+1].trigger != 'click')
						currentAnimation = x;
						if ($element.length) $element.queue(function(){
							$element.dequeue();
							$this.dequeue();
						});
						else $this.dequeue();
					});
				};


            $this.data('transition', json.transition)
			
			.bind('transit', function(e, o) {
                var transition = json.transition[o.tId];
                    transition.callback = o.callback;
                // Switch the class first
                $this.toggle(transition.effect, transition);

            }).bind('fullsize', function(e, animated) {
                $this[animated? 'animate' : 'css']({width: '100%', height: '100%', fontSize: '100%'}, animated);
				$this.queue(function() {
					$this.css('position', 'absolute');
					$this.dequeue();
				})

            }).bind('thumbnailize', function(e, animated) {
                $this.css('position', 'relative')[animated? 'animate' : 'css']({width: '23%', height: '23%', fontSize: '23%'});

           	}).bind('forward', function() {
                forwind(0);

            }).bind('rewind', function() {
                forwind(1);

            }).bind('editable', function() {
				$this.animate({
					width: '80%', 
					height: '80%', 
					fontSize: '80%',
					marginTop: '7%',
					marginLeft: '10%'
				});
			});
        });
    };

    /*
     * Init sldmElement
     */
    $.fn.element = function(parentId, fontCoefs) {
        return this.each(function() {                
            var $this = $(this),
                // Find fontClass
                match = $this.attr('id', parentId +'-'+ $this.attr('id')).attr('class').match(/sldmFont./);


            $this.bind('applyFont', function(e, fontClass) {
                // Retrieve original fontSize
                var fontSize = $this.attr('data-fontsize') || function(fs) {
                    return /%/.test(fs)? parseInt(fs) : 100;
                }($this.css('fontSize'));
                // Update element
                $this.attr('class', 'sldmElement '+ fontClass).attr('data-fontsize', fontSize)
                .css('fontSize', fontSize * fontCoefs[fontClass] +'%');

            }).bind('editable', function(e, editable) {
                if (editable) {

                }
            });
            // Apply font & Store original css values for use when rewinding to initial state
            // FIX: make sure the coeficiented fontSize is stored
            //if (match) $this.trigger('applyFont', match[0]).cssStore();
        });
    };

    /*
     * Init sldmNavSlider
     */
    $.fn.navSlider = function($presentation) {
        return this.each(function() {
            var $this = $(this).slider({
                    handle: ':first',
                    axis: 'vertical',
                    min: 0,
                    max: 150,
                    stop: function(e, ui) {
                        $presentation.animate({'marginTop' : ($presentation.data('length') * ui.value / 150 -1) * -18.75 +'%'}, 500);
                    },
                    slide: function(e, ui) {
                        $presentation.css('marginTop', ($presentation.data('length') * ui.value / 150 -1) * -18.75 +'%');
                    }
                }),
                $handle = $this.children(':first').unbind('keydown');


            // Overwrite keydown event to invert y axis and use steps
			$this.keydown(function(e) {
				switch(e.which) {
					case 38:
						$this.slider('moveTo', $this.slider('value') - 150 / $presentation.data('length'));
						break;
					case 40:
						$this.slider('moveTo', $this.slider('value') + 150 / $presentation.data('length'));
						break;
				}

            }).bind('show', function() {
                $this.fadeIn();
                $handle.focus();

            }).bind('hide', function() {
                $this.fadeOut();

            }).bind('update', function(e, step) {
                $this.slider('moveTo', step * 150 / $presentation.data('length'), undefined, true);
            
            // click on navSlider shouldn't bubble to the view
            }).click(function() { return false; });
        });
    };

    /*
     * Init sldmNavBar
     */
    $.fn.navBar = function($view) {
        return this.each(function() {
            var $this = $(this),
				$window = $(window),
                $bar = $this.children('ul:first'),
                $presentation = $view.children(':first'),
				shift = false,
				ctrl = false,
				
				userAction = function(code) {
					switch(code) {
						case 37:
							if(!$presentation.is('.sldmEditable'))
								$presentation.trigger('rewind');
							break;
						case 39:
							if(!$presentation.is('.sldmEditable'))
								$presentation.trigger('forward');
							break;
						case 38:
							if(!$presentation.is('.sldmEditable'))
								$presentation.trigger('fastrewind');
							break;
						case 40:
							if(!$presentation.is('.sldmEditable'))
								$presentation.trigger('fastforward');
							break;
						case 109:
	                        $view.trigger('toggleNavigation');
	                        $presentation.trigger('thumbnailize');                        
							break;
						// TOFIX: detect both + and =, we should use keypress instead
						// most of all, this shortcut is a bad one
						case 61:
							//TOFIX: we should only show the rest of the options under the navigation bar
							//$view.trigger('editable');
							break;
						case 89:
							if(ctrl && $presentation.hasClass('sldmEditable')) {
								$presentation.trigger('redo');
								return false;
							}								
							break;
						case 90:
							if(ctrl && $presentation.hasClass('sldmEditable')) {
								$presentation.trigger('undo');
								return false;
							}								
							break;
					}
					return true;
				};


            // Toggle navBar visibility
            $this.mouseover(function() {
                if ($.sldm.navTimer) 
					clearTimeout($.sldm.navTimer);
				// Show it only in fullsize mode
                if (!$presentation.hasClass('sldmThumbnail')) $bar.animate({bottom: '0px'});

            }).mouseout(function(){
				$.sldm.navTimer = setTimeout(function(){
					if ($this.is(':visible'))
                        $bar.animate({bottom: '-28px'});
				}, 800);

            }).click(function(e){
				userAction(parseInt(e.target.className.match(/sldm(\d*)/)[1]));				

            });
			
			// Yes, $window should be in it's own class, but it's here...
			$window.keydown(function(e) {
				switch(e.keyCode) {
					case 17:
						ctrl  = true;
						break;
					case 16:
						shift = true;
						break;
					default:
						return userAction(e.keyCode);
						break;
				}				
				
			}).keyup(function(e) {
				switch (e.keyCode) {
					case 17:
						ctrl  = false;
						break;
					case 16:
						shift = false;
						break;					
				}
			});			
        })
    };    
})(jQuery);

/*,
			
            	forwind = function(aft) {
                    $this.queue(function() {						
						// Iterate through selectors (start from 1, 0 is for the 'beat')
                        for( var y = 1 ; y < y_length ; y++) {
                            var x = currentAnimation,
                                delay = 0,
                                duration = 0,
                                animation = {};
                            // TOFIX: see squeezer.core.js for a good loop !
							while((x > 0 || !aft && x == 0) && (x < xLength || aft && x == xLength)) {								
                                if(!animations[y][x]) {
									// 0 with a prepared animation means "trigger the animation"
									if(animation.type) {
										animate(animation, duration, delay);
	                                    // reset animation
										delay = duration = 0;
										animation = {};
									// 0 without prepared animation means "increment delay"
									} else delay++;
								}
								// 1 means "increment duration"
                                else if(animations[y][x] == 1) duration++;                                
                                // Prepare an animation
								else {
                                    duration++;
									animation = animations[y][x];
                                    animation.selector = animations[y][0];
                                }
								x += aft? -1 : 1;
								// O in the timeline means "user needs to click"
								if(!animations[0][x - (aft? -1 : 1)]) {
									// Don't forget to trigger last animation
									if(animation.type) animate(animation, duration, delay);
									break;
								}
                            }                            
                        }
						// Dequeue slide and trigger "fast*" event after the last animation
                        setTimeout(function() {
                            if(x == 1)
                                $presentation.trigger('fastrewind');
                            else if(x == xLength)
                                $presentation.trigger('fastforward');
                            $this.dequeue();
                        }, Math.abs(x - currentAnimation) * time_scale);
                        currentAnimation = x;
                    });
                }*/