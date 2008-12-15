(function($) {
    /*
     * Use me on a collection of span with different font-families and the intended width for the span
     * and I'll tell you what coefficient to apply on fontSize for element with this fontFamily :)
     */
    $.fn.coef = function() {
        var fontCoefs = {};
        // for each font family (see style.css)
        this.each(function() {
            var $this = $(this);
            fontCoefs[$this.attr('class')] = $this.attr('data-width') / $this.width();
        });
        return fontCoefs;
    };

    /*
     * Use me and I'll store your values for useful css properties in your css_store.
     * I'll make sure to return values in % where applicable :)
     */
    $.fn.cssStore = function() {
        return this.each(function() {
            var $this = $(this),
                cssStore = {},
                tmpCss,
				percent = ['width', 'height', 'top', 'left'],
				pWidth,	pHeight;
            for(var i in percent) {
                tmpCss = $this.css(percent[i]);
                // make sure dimensions are in percent
                if (!/%$/.test(tmpCss)) {
                        // Cache dimensions
                        pWidth = pWidth || $this.parent().width();
                        pHeight = pHeight || $this.parent().height();
						//console.log(percent[i]+': '+tmpCss+' / '+(/^t|h/.test(percent[i]) ? pHeight : pWidth))
                		// TODO : if it happens too often, consider precalculating parent dimensions.
                        //console.warn('non percent value found in '+$this.attr('id')+' : '+percent[i]+'='+tmpCss);
                        tmpCss = Math.round(100 * (parseInt(tmpCss) / parseInt(/^t|h/.test(percent[i]) ? pHeight : pWidth))) +'%';
                        
                }
				cssStore[percent[i]] = tmpCss;
            }
            // Finger in the noze for those
            for (var j in ['color', 'opacity', 'fontSize', 'display'])
                cssStore[j] = $this.css(j);
            $this.data('cssStore', cssStore);
        })
    }
})(jQuery);