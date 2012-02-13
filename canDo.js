var canDo = function(el, args){
	
	// Our 2d rendering context
	var ctx  = el.getContext('2d'); 
	
	/* Properties of our Canvas timeline with some defaults. They are not specific to any method call */ 
	ctx.t = { // t=timeLine
		duration: args.duration ? args.duration : 1000,	 // Timeline duration in 1/1000 seconds
		frameRate: args.frameRate ? args.frameRate : 60, // Our target framerate
		frameInterval : 30, // Milliseconds between frames (recalculated below)
		cuePoints: args.cuePoints ? args.cuePoints : {}, // Our list of cuepoints
		mode: args.mode ? args.mode : 'loop' // Playback mode ('' = Play 1x, 'loop')
	};

	// The calculated value of milliseconds between frames
	ctx.t.frameInterval = Math.floor(1000 / ctx.t.frameRate);		
	
	// Properties of our playback head
	ctx.s = { // s=status
		time: args.setTime ? args.setTime : 0, // Setting the playback head position on the timeline (0.0 - 1.0)
		speed: args.playbackSpeed ? args.playbackSpeed : 1.0, // For stretching the timeline (sill in development)
		startTime: 0,	 // The start time of the current play event (calculated on play)
		endTime: 0, // The end time of the current play event (calculated on play)
		intervalTimer: 0 // The setInterval used for refresh
	}
	
	// Yeah, we're gonna need this
	ctx.paint = args.paint;
	
	// Begin the animation
	ctx.play = function(args) {
		
		if (!args) args = {}; // We can pass in args to our play function as well
		if (args.speed) ctx.s.speed = args.speed; // Update with new speed if speed property was passed
		if (args.time) ctx.s.time = args.time; // Update the playback head position if time property was passed
		
		// Calculate our new time values
		ctx.t.scaledDuration = ctx.t.duration / ctx.s.speed;
		// This next line is wrong
		ctx.s.time == 0 ? ctx.s.startTime = Date.now() : ctx.s.startTime = Date.now() - ctx.t.scaledDuration /  ctx.s.time; 
		ctx.s.endTime = ctx.s.startTime + ctx.t.scaledDuration;
		
		// Start our interval timer and render the first frame
		ctx.s.intervalTimer = setInterval (function() { ctx.update(); }, ctx.t.frameInterval);
		ctx.update();
	}
	
	// Our refresh function
	ctx.update = function() {
		
		// Find where we are on the timeline
		ctx.s.time = (Date.now() - ctx.s.startTime) / ctx.t.scaledDuration;
		
		// this conditional needs to change to support playing backwards
		if (ctx.s.time < 1.0) {  // If the animation is not finished
			
			ctx.paint(); // Update the canvas and keep on truckin'
			
		} else { // The animation is finished
			
			if (ctx.t.mode == '') { // If we are set to play through one time
				clearInterval(ctx.s.intervalTimer); // Cancel the refresh interval timer
				ctx.s.time = 1.0; // Set time to end of animation
				ctx.paint(); // Update the canvas
			}
			
			if (ctx.t.mode == 'loop') { // We are set to loop
				ctx.s.time = 1.0; // Set time to end of animation
				ctx.paint(); // Update the canvas
				ctx.s.time = 0; // Set time to the beginning of the animation
				ctx.play({time:0}); // Play from the beginning
			}
		}
	}
	
	ctx.getCurrentKeyframe = function (keyFrames) {
		var result = {};
		result.start = 0, result.end = 1;
		for (i=0, j= keyFrames.length;i<j;i++) {
			if ( typeof( keyFrames[i].cuePoint) === "string") {
				keyFrames[i].cuePoint = ctx.t.cuePoints[keyFrames[i].cuePoint];
			}
			if (keyFrames[i].cuePoint < ctx.s.time) {
				result.start = i;result.end = i+1;
			}
		}
		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint;
		result.subTime = Math.pow(ctx.s.time - keyFrames[result.start].cuePoint, 2) / result.subDuration;
		result.bounces = 0;
		return result;
	}
	
	ctx.identity = function() { 
    	this.setTransform(1, 0, 0, 1, 0, 0); 
	}

	ctx.canDo = function(method, keyFrames) {
		var beg = ctx.getCurrentKeyframe(keyFrames);
		var result = ctx.easing[keyFrames[beg.end].easing](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration);
		ctx[method].apply(this, result);
	};
	
	// Transformations
	// void scale(double x, double y);
	// void rotate(double angle);
	// void translate(double x, double y);
	// void transform(double a, double b, double c, double d, double e, double f);
	// void setTransform(double a, double b, double c, double d, double e, double f);
	
	// compositing
	// attribute double globalAlpha; // (default 1.0)
	// attribute DOMString globalCompositeOperation; // (default source-over)
			   
	// colors and styles
	// attribute any strokeStyle; // (default black)
	// attribute any fillStyle; // (default black)
	// CanvasGradient createLinearGradient(double x0, double y0, double x1, double y1);
	// CanvasGradient createRadialGradient(double x0, double y0, double r0, double x1, double y1, double r1);
	// CanvasPattern createPattern(HTMLImageElement image, DOMString repetition);
	// CanvasPattern createPattern(HTMLCanvasElement image, DOMString repetition);
	// CanvasPattern createPattern(HTMLVideoElement image, DOMString repetition);
	
	// line caps/joins
	// attribute double lineWidth; // (default 1)
	// attribute DOMString lineCap; // "butt", "round", "square" (default "butt")
	// attribute DOMString lineJoin; // "round", "bevel", "miter" (default "miter")
	// attribute double miterLimit; // (default 10)
	
	// shadows
	// attribute double shadowOffsetX; // (default 0)
	// attribute double shadowOffsetY; // (default 0)
	// attribute double shadowBlur; // (default 0)
	// attribute DOMString shadowColor; // (default transparent black)
   
	// rects
	// void clearRect(double x, double y, double w, double h);
	// void fillRect(double x, double y, double w, double h);
	// void strokeRect(double x, double y, double w, double h);
	
	// path API
	// void moveTo(double x, double y);
	// void lineTo(double x, double y);
	// void quadraticCurveTo(double cpx, double cpy, double x, double y);
	// void bezierCurveTo(double cp1x, double cp1y, double cp2x, double cp2y, double x, double y);
	// void arcTo(double x1, double y1, double x2, double y2, double radius); 
	// void rect(double x, double y, double w, double h);
	// void arc(double x, double y, double radius, double startAngle, double endAngle, optional boolean anticlockwise); 
	// void drawSystemFocusRing(Element element);
	// boolean drawCustomFocusRing(Element element);
	// boolean isPointInPath(double x, double y);
	
	// text
	// attribute DOMString font; // (default 10px sans-serif)
	// attribute DOMString textAlign; // "start", "end", "left", "right", "center" (default: "start")
	// attribute DOMString textBaseline; // "top", "hanging", "middle", "alphabetic", "ideographic", "bottom" (default: "alphabetic")
	// void fillText(DOMString text, double x, double y, optional double maxWidth);
	// void strokeText(DOMString text, double x, double y, optional double maxWidth);
	// TextMetrics measureText(DOMString text);
	
	
	// drawing images
	// void drawImage(HTMLImageElement image, double dx, double dy);
	// void drawImage(HTMLImageElement image, double dx, double dy, double dw, double dh);
	// void drawImage(HTMLImageElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
	// void drawImage(HTMLCanvasElement image, double dx, double dy);
	// void drawImage(HTMLCanvasElement image, double dx, double dy, double dw, double dh);
	// void drawImage(HTMLCanvasElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
	// void drawImage(HTMLVideoElement image, double dx, double dy);
	// void drawImage(HTMLVideoElement image, double dx, double dy, double dw, double dh);
	// void drawImage(HTMLVideoElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
  
	// pixel manipulation
	// ImageData createImageData(double sw, double sh);
	// ImageData createImageData(ImageData imagedata);
	// ImageData getImageData(double sx, double sy, double sw, double sh);
	// void putImageData(ImageData imagedata, double dx, double dy);
	// void putImageData(ImageData imagedata, double dx, double dy, double dirtyX, double dirtyY, double dirtyWidth, double dirtyHeight);
  
  
	// interface CanvasGradient {
	// // opaque object
	// void addColorStop(double offset, DOMString color);
	// };

	// interface CanvasPattern {
	// // opaque object
	// };
  
	/* These functions are based on easing equations from jQuery UI
	 * Copyright 2001 Robert Penner
	 * t: current time, b: begInnIng value, c: change In value, d: duration */
	ctx.easing = {
		/*def: "easeOutQuad",
		swing: function ( x, t, b, c, d ) {
			return $.easing[ $.easing.def ]( x, t, b, c, d );
		},*/
		easeInQuad: function ( x, t, b, c, d ) {
			var result = [], v = Math.pow(t/d, 2);
			for (k=0,l=b.length;k<l;k++) {
				result.push( ( c[k] - b[k] ) * v + b[k] );
			}
			return result;
		},
		easeOutQuad: function ( x, t, b, c, d ) {
			var result = [], v = (t/d) * (t/d-2);
			for (k=0,l=b.length;k<l;k++) {
				result.push( -(c[k]-b[k]) * v + b[k]);
			}
			return result;
		},
		easeInOutQuad: function ( x, t, b, c, d ) {
			var result = [], v = t/(d/2);
			for (k=0,l=b.length;k<l;k++) {
				var w = (c[k]-b[k])/2;
				if ( ( v ) < 1 ) {
					result.push( w * v * v + b[k]);
				} else {
					result.push( -1 *  w * ( ( v-1 ) * ( v-3 ) - 1) + b[k]);
				}
			}
			return result;
		}
		/*
		easeInCubic: function ( x, t, b, c, d ) {
			return c * ( t /= d ) * t * t + b;
		},
		easeOutCubic: function ( x, t, b, c, d ) {
			return c * ( ( t = t / d - 1 ) * t * t + 1 ) + b;
		},
		easeInOutCubic: function ( x, t, b, c, d ) {
			if ( ( t /= d / 2 ) < 1 ) return c / 2 * t * t * t + b;
			return c / 2 * ( ( t -= 2 ) * t * t + 2) + b;
		},
		easeInQuart: function ( x, t, b, c, d ) {
			return c * ( t /= d ) * t * t * t + b;
		},
		easeOutQuart: function ( x, t, b, c, d ) {
			return -c * ( ( t = t / d - 1 ) * t * t * t - 1) + b;
		},
		easeInOutQuart: function ( x, t, b, c, d ) {
			if ( (t /= d / 2 ) < 1 ) return c / 2 * t * t * t * t + b;
			return -c / 2 * ( ( t -= 2 ) * t * t * t - 2) + b;
		},
		easeInQuint: function ( x, t, b, c, d ) {
			return c * ( t /= d ) * t * t * t * t + b;
		},
		easeOutQuint: function ( x, t, b, c, d ) {
			return c * ( ( t = t / d - 1 ) * t * t * t * t + 1) + b;
		},
		easeInOutQuint: function ( x, t, b, c, d ) {
			if ( ( t /= d / 2 ) < 1 ) return c / 2 * t * t  * t * t * t + b;
			return c / 2 * ( ( t -= 2 ) * t * t * t * t + 2) + b;
		},
		easeInSine: function ( x, t, b, c, d ) {
			return -c * Math.cos( t / d * ( Math.PI / 2 ) ) + c + b;
		},
		easeOutSine: function ( x, t, b, c, d ) {
			return c * Math.sin( t / d * ( Math.PI /2 ) ) + b;
		},
		easeInOutSine: function ( x, t, b, c, d ) {
			return -c / 2 * ( Math.cos( Math.PI * t / d ) - 1 ) + b;
		},
		easeInExpo: function ( x, t, b, c, d ) {
			return ( t==0 ) ? b : c * Math.pow( 2, 10 * ( t / d - 1) ) + b;
		},
		easeOutExpo: function ( x, t, b, c, d ) {
			return ( t==d ) ? b + c : c * ( -Math.pow( 2, -10 * t / d) + 1) + b;
		},
		easeInOutExpo: function ( x, t, b, c, d ) {
			if ( t==0 ) return b;
			if ( t==d ) return b + c;
			if ( ( t /= d / 2) < 1) return c / 2 * Math.pow( 2, 10 * (t - 1) ) + b;
			return c / 2 * ( -Math.pow( 2, -10 * --t ) + 2 ) + b;
		},
		easeInCirc: function ( x, t, b, c, d ) {
			return -c * ( Math.sqrt( 1 - ( t /= d ) * t ) - 1 ) + b;
		},
		easeOutCirc: function ( x, t, b, c, d ) {
			return c * Math.sqrt( 1 - ( t = t / d - 1 ) * t ) + b;
		},
		easeInOutCirc: function ( x, t, b, c, d ) {
			if ( ( t /= d / 2) < 1 ) return -c / 2 * ( Math.sqrt( 1 - t * t ) - 1 ) + b;
			return c / 2 * ( Math.sqrt( 1 - ( t -= 2 ) * t ) + 1 ) + b;
		},
		easeInElastic: function ( x, t, b, c, d ) {
			var s = 1.70158,
				p = d * 0.3,
				a = c;
			if ( t == 0 ) return b;
			if ( ( t /= d ) == 1 ) return b+c;
			if ( a < Math.abs( c ) ) {
				a = c;
				s = p / 4;
			} else {
				s = p / ( 2 * Math.PI ) * Math.asin( c / a );
			}
			return - ( a * Math.pow( 2, 10 * ( t -= 1 ) ) * Math.sin( ( t * d - s) * ( 2 * Math.PI ) / p ) ) + b;
		},
		easeOutElastic: function ( x, t, b, c, d ) {
			var s = 1.70158,
				p = d * 0.3,
				a = c;
			if ( t == 0 ) return b;
			if ( ( t /= d ) == 1 ) return b+c;
			if ( a < Math.abs( c ) ) {
				a = c;
				s = p / 4;
			} else {
				s = p / ( 2 * Math.PI ) * Math.asin( c / a );
			}
			return a * Math.pow( 2, -10 * t ) * Math.sin( ( t * d - s ) * ( 2 * Math.PI ) / p ) + c + b;
		},
		easeInOutElastic: function ( x, t, b, c, d ) {
			var s = 1.70158,
				p = d * ( 0.3 * 1.5 ),
				a = c;
			if ( t == 0 ) return b;
			if ( ( t /= d / 2 ) == 2 ) return b+c;
			if ( a < Math.abs( c ) ) {
				a = c;
				s = p / 4;
			} else {
				s = p / ( 2 * Math.PI ) * Math.asin( c / a );
			}
			if ( t < 1 ) return -.5 * ( a * Math.pow( 2, 10 * ( t -= 1 ) ) * Math.sin( ( t * d - s ) * ( 2 * Math.PI ) / p ) ) + b;
			return a * Math.pow( 2, -10 * ( t -= 1 ) ) * Math.sin( ( t * d - s ) * ( 2 * Math.PI ) / p ) *.5 + c + b;
		},
		easeInBack: function ( x, t, b, c, d, s ) {
			if ( s == undefined ) s = 1.70158;
			return c * ( t /= d ) * t * ( ( s+1 ) * t - s ) + b;
		},
		easeOutBack: function ( x, t, b, c, d, s ) {
			if ( s == undefined ) s = 1.70158;
			return c * ( ( t = t / d - 1 ) * t * ( ( s + 1 ) * t + s) + 1) + b;
		},
		easeInOutBack: function ( x, t, b, c, d, s ) {
			if ( s == undefined ) s = 1.70158;
			if ( ( t /= d / 2 ) < 1 ) return c / 2 * ( t * t * ( ( ( s *= 1.525 ) + 1 ) * t - s ) ) + b;
			return c / 2 * ( ( t -= 2 ) * t * ( ( ( s *= 1.525 ) + 1 ) * t + s) + 2) + b;
		},
		easeInBounce: function ( x, t, b, c, d ) {
			return c - $.easing.easeOutBounce( x, d - t, 0, c, d ) + b;
		},
		easeOutBounce: function ( x, t, b, c, d ) {
			if ( ( t /= d ) < ( 1 / 2.75 ) ) {
				return c * ( 7.5625 * t * t ) + b;
			} else if ( t < ( 2 / 2.75 ) ) {
				return c * ( 7.5625 * ( t -= ( 1.5 / 2.75 ) ) * t + .75 ) + b;
			} else if ( t < ( 2.5 / 2.75 ) ) {
				return c * ( 7.5625 * ( t -= ( 2.25/ 2.75 ) ) * t + .9375 ) + b;
			} else {
				return c * ( 7.5625 * ( t -= ( 2.625 / 2.75 ) ) * t + .984375 ) + b;
			}
		},
		easeInOutBounce: function ( x, t, b, c, d ) {
			if ( t < d / 2 ) return $.easing.easeInBounce( x, t * 2, 0, c, d ) * .5 + b;
			return $.easing.easeOutBounce( x, t * 2 - d, 0, c, d ) * .5 + c * .5 + b;
		}*/
	}	
	return ctx;
};