/*

The MIT License (MIT)
Copyright (c) 2012 Donovan Buck

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

------------ end license --------------

Color Conversion functions from highlightFade
By Blair Mitchelmore
http://jquery.offput.ca/highlightFade/

Easing equations from Robert Penner (http://www.robertpenner.com/easing)
Blatantly lifted from jQuery UI

Stripped down implementation of each and has from underscore

Stripped down implementation of extend from jQuery

Tip o' the hat to @p01 and @Nosredna for chainable Canvas methods trick

global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

/*jslint browser: true*/

var CanDo = function (elid, args) {
	"use strict";
	// Hoisted variables
	var el = window.document.getElementById(elid), 
		ctx, 
		baseEasings, 
		imagesLeftToLoad = 0,
		imageLoaded = function () {
			
			imagesLeftToLoad = imagesLeftToLoad - 1;
	
			if (imagesLeftToLoad === 0) {
				
				// If we want a splash screen, render it now
				if (ctx.s.splash) {
					ctx.update({time: 0});
				}
				
				ctx.s.loaded = true;
			}
		};

	//
	// ### The canvas rendering context ###
	// Note that we attach all our stuff to each context. No looking back to the prototype!
	el.ctx = ctx = el.getContext('2d');

	// Default status of our animation
	ctx.s = { 
		duration: 1000,			// Duration of the animation
		frameRate: 60,			// Frame rate (aren't you glad I added this comment?)
		cuePoints: {},			// A list of user defined cuepoints on the timeline
		mode: '',				// ['' || 'loop'] '' will play through one time, 'loop' will loop
		wait: true,				// wait for images to load
		splash: true,			// Will render the first frame if animations is not playing
		easing: 'linear',		// Lots of easing functions available. See the docs
		time: 0,				// Linear clock time
		easedTime: 0,			// Eased clock time
		cuePointSegment: '',	// 0 <= to first cuePoint, 1 = between first and second cuePoints
		speed: 0,				// Important, real duration = duration * abs(speed)
		startTime: 0,			// Real or calculated startTime on the clock
		endTime: 0,				// Calculated end time
		intervalTimer: 0,		// The duration of a frame
		loaded: true,			// Are all bitmap images loaded
		canvasEvents: {},		// Events that are bound to the canvas element
		eventsQueue: {},		// Queues events gathered from Canvas element
		eventHandlerQueue: [],	// Handlers that were triggered this frame
		currentEvents:{},		// Canvas events to actively monitor
		eventProp: 'all',		// Even propogation style ('all'|'first'|'last')
		currentCuePoints:{}		// The current cuepoints to the left and right of our playback head
	};

	// Default path status
	ctx.p = {};

	// Handle changes passed in via the configuration object
	ctx.configure = function (args) { 
		
		var imageName, eventName;

		if (typeof args !== 'undefined') {
			CanDo.extend(this.s, args);
		
			// Update playback status properties
			if (typeof args.setTime !== 'undefined') {
				this.s.easedTime = this.s.time = args.setTime;
			}		

			// Go through the images and make sure they are loaded before we start drawing
			if (typeof args.images !== 'undefined') { // If an images object was passed
				this.s.loaded = false;
				this.images = args.images;
				for (imageName in this.images) { // Loop through each image
					if (this.images.hasOwnProperty(imageName)) {
						imagesLeftToLoad = imagesLeftToLoad + 1;
						this.images[imageName].img = new window.Image();
						this.images[imageName].img.onload = imageLoaded;
						this.images[imageName].img.src = this.images[imageName].url; // Set the src for the image to start loading it
					}
				}
			}

			// Yeah, we're gonna need this
			if (typeof args.paint !== 'undefined') {
				this.paint = args.paint;
			}
	
			// Event handlers
			if (typeof args.events !== 'undefined') { // If an events object was passed
				this.s.canvasEvents = args.events;
			}
			
			this.s.frameInterval = Math.floor(1000/this.s.frameRate);
			
		}
		
	};

	// Begin the animation
	ctx.play = function (args) {
		// Used to hold how much time has already passed in the animation
		var preTime; 
		clearInterval(this.s.intervalTimer);

		if (typeof args !== 'undefined') {
			this.configure(args);
		}
		this.s.cuePointSegment = this.getCuePointSegment();
		
		if (this.s.wait && this.s.loaded === false) {
			setInterval(function (context, args) { context.play(args); }, 100, this, args);
		}
		
		// Calculate our new time values
		this.s.scaledDuration = Math.abs(this.s.duration / this.s.speed); 
		
		// If we are playing backwards we need to invert the preTime factor
		preTime = this.s.speed < 0 ? 1 - this.s.time : this.s.time; 
		
		// Calculate what our start time is/would have been on the system clock (remember, we can play from the middle)
		this.s.startTime = this.s.time === 0 ? Date.now() : Date.now() - ctx.s.scaledDuration * preTime;
		this.s.endTime = this.s.startTime + this.s.scaledDuration; 
		
		// Start our interval timer and render the first frame
		this.s.intervalTimer = setInterval(function (context) { context.update(); }, this.s.frameInterval, this);
		
		this.update();
		
	};

	// Our refresh function
	ctx.update = function (args) {
		// The next two blocks can be combined
		if (typeof args === 'undefined') {
			args = {};
		} else {
			this.configure(args);	
		}
		
		// Find where we are on the timeline
		if (typeof args.time === 'undefined') {
			if (this.s.speed > 0) {
				this.s.time = (Date.now() - this.s.startTime) / this.s.scaledDuration;
			} else if (this.s.speed < 0) {
				this.s.time = (this.s.endTime - Date.now()) / this.s.scaledDuration;
			}
		} else {
			// The time is being explicitly set
			this.s.time = args.time;
			this.s.cuePointSegment = this.getCuePointSegment();
		}
		
		this.s.easedTime = CanDo.easing[this.s.easing](this.s.time);

		// Update the cuePoint segment

		var t = this.getCuePointSegment();
		if (t !== null && t !== this.s.cuePointSegment && ctx.s.cuePoints[t].events) {	
			this.s.cuePointSegment = t;
			
			if (ctx.s.cuePoints[t].events.trip) {
				ctx.s.cuePoints[t].events.trip.apply( this );
			}
			
			if (this.s.speed > 0 && ctx.s.cuePoints[t].events.tripForward ) {
				ctx.s.cuePoints[t].events.tripForward.apply( this );
			} else if (this.s.speed < 0 && ctx.s.cuePoints[t].events.tripBackward) {
				ctx.s.cuePoints[t].events.tripBackward.apply( this );
			}
			
		}
		
		// Move events from eventsQueue to currentEvents
		this.s.currentEvents = this.s.eventsQueue;
		this.s.eventsQueue = {};
		
		// If the animation is not finished
		if (typeof args.still !== 'undefined' || (this.s.time < 1.0  && this.s.speed > 0) || (this.s.time > 0  && this.s.speed < 0)) {  

			// Update the canvas and keep on truckin'
			this.paint(); 

		} else { 

			this.s.cuePointSegment = null;
			
			// If we are set to play through one time
			if (this.s.mode === '') { 
				clearInterval(this.s.intervalTimer);
				this.s.time = this.s.speed > 0 ? 1.0 : 0;
				this.s.easedTime = this.s.speed > 0 ? 1.0 : 0;
				this.paint();
				this.s.speed = 0;	
			}
			
			// If we are set to loop
			if (this.s.mode === 'loop') {
				this.s.easedTime = this.s.time = this.s.speed > 0 ? 1.0 : 0;
				this.paint();
				this.s.easedTime = this.s.time = this.s.speed > 0 ? 0 : 1.0;
				this.play({time: 0});
			}
		}
		
		//Handle Canvas events
		this.doCanvasEvents();
		this.doEventHandlerQueue();

	};

	ctx.getCuePointSegment = function() {
		var left = null, right = null, that = this;
		
		CanDo.each(this.s.cuePoints, function(cuePoint, name) {
			if (cuePoint.time < that.s.time ) {
				left = name;
			} else if (cuePoint.time >= that.s.time && right === null) {
				right = name;
			}
		});
		
		if (this.s.speed === 0) {
			return null;
		} else {
			return this.s.speed < 0 ? right : left;	
		}
		
	};
	
	// Fire events that have been applied to the canvas
	ctx.doCanvasEvents = function() {
		CanDo.each(this.s.currentEvents, function (func, name) {
			if (typeof ctx.s.canvasEvents[name] !== 'undefined') ctx.s.canvasEvents[name].apply( this );
		});
	};
	
	ctx.doEventHandlerQueue = function() {
		if (this.s.eventHandlerQueue.length > 0) {
			if (this.s.eventProp === 'first') {
				this.s.eventHandlerQueue[0].apply( this );
			} else if (this.s.eventProp === 'last') {
				this.s.eventHandlerQueue.pop().apply( this );
			} else {
				this.each(this.s.eventHandlerQueue, function ( func, iterator) {
					func.apply( this );
				});
			}
		}
		this.s.eventHandlerQueue = [];
	};

	// Find out which keyframes we are using (definitely room for improvement here)
	ctx.getCurrentKeyframe = function (keyFrames) {

		var i, j = keyFrames.length, result = { start: 0, end: 1}; // Our result object

		if (typeof keyFrames[0].cuePoint === 'undefined') {
			keyFrames[0].cuePoint = 0.0;
		}

		if (typeof keyFrames[j-1].cuePoint === 'undefined') {
			keyFrames[j-1].cuePoint = 1.0;
		}

		for (i = 0; i < j; i = i + 1) { //Loop through the keyframes
			if (typeof (keyFrames[i].cuePoint) === "string") { // If they keyframe was passed as a name
				keyFrames[i].cuePoint = this.s.cuePoints[keyFrames[i].cuePoint]; // Get the name value and update the cuepoint so we don't have to do this again
			}
			if (keyFrames[i].cuePoint <= this.s.easedTime) { // If this cuepoint occurs before the current time
				result.start = i;
				result.end = i + 1; // This could be our cuepoint (might be replaced later in our loop)
			}
		}

		if (result.end === keyFrames.length) {
			result.end = keyFrames.length - 1;
			result.start = result.end;
		}

		// Calculate the time between our two keyframes
		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint; 
		
		// Calculate how far through this transition we are
		result.subTime = (this.s.easedTime - keyFrames[result.start].cuePoint) / result.subDuration;
		return result;
	};

	// Find out which cuePoints we are between
	ctx.getCurrentCuePoints = function () {
		// If the current cuePoints do not exist or we are outside their time range
		if(this.s.currentCuepoints.start !== 'undefined' || this.s.currentCuepoints.end !== 'undefined' || this.s.currentCuepoints.start.time > this.s.time || this.s.currentCuepoints.end.time < this.s.time) {
		}
	};

	// Convenience method for resetting the transformation matrix to the identity transform
	ctx.identity = function () {
		this.setTransform(1, 0, 0, 1, 0, 0);
		return ctx;
	};

	// Here's our method wrapper
	ctx.canDo = function (method, keyFrames) {
		var state, result, beg = this.getCurrentKeyframe(keyFrames); // Find the start point for the current animation segment
		if (beg.start === beg.end) {
			state = keyFrames[beg.start].params;
		} else {
			state = ctx.easeThis(keyFrames[beg.end].easing || 'linear', beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params); // Eases all the properties in the array
		}

		if (beg.start !== beg.end || keyFrames[beg.end].cuePoint === 1.0 || (keyFrames[beg.end].cuePoint !== 1.0 && keyFrames[beg.end].persist === true)) {
			result = this[method].apply(this, state); // Call the proxied function with the computed parameters
		}
		return ctx;
	};

	// Here's our setter wrapper
	ctx.canSet = function (property, keyFrames) {
		var state, result, beg = this.getCurrentKeyframe(keyFrames); // Find the start point for the current animation segment
		if (beg.start === beg.end) {
			state = keyFrames[beg.start].params;
		} else {
			state = ctx.easeThis(keyFrames[beg.end].easing || 'linear', beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params); // Eases all the properties in the array
		}
		if (beg.start !== beg.end || keyFrames[beg.end].cuePoint === 1.0 || (keyFrames[beg.end].cuePoint !== 1.0 && keyFrames[beg.end].persist === true)) {
			this[property] = state[0]; // Call the proxied function with the computed parameters
		}
		return ctx;
	};
	
	// Here's our path wrapper
	ctx.canBeginPath = function (pathConfig) {
		if (typeof pathConfig !== 'undefined') {
			if (typeof pathConfig.easing !== 'undefined') {
				ctx.p.easing = pathConfig.easing;
			}
			if (typeof pathConfig.events !== 'undefined') {
				ctx.p.events = pathConfig.events;
			}
		}
		this.beginPath();
		return ctx;
	};
		
	ctx.canClosePath = function () {
		if(typeof ctx.p.events !== 'undefined') {
			CanDo.each(ctx.p.events, function (func, name) {
				if (typeof ctx.s.currentEvents[name] !== 'undefined' && ctx.isPointInPath(ctx.s.currentEvents[name].x, ctx.s.currentEvents[name].y) === true) {
					ctx.s.eventHandlerQueue.push(ctx.p.events[name]);
					//ctx.p.events[name].apply( this );
				}
			});
		}
		ctx.p = {};
		this.closePath();
		return ctx;
	};
	
	ctx.canShadow = function() {
		this.shadowColor(arguments[0]);
		this.shadowOffsetX(arguments[1]);
		this.shadowOffsetY(arguments[2]);
		this.shadowBlur(arguments[3]);
		return ctx;
	};

	// This is our easing call
	ctx.easeThis = function (easing, time, startParams, endParams) {

		var i,  j = startParams.length, result = [], state, startColor, endColor, stateColor;
		for (i = 0; i < j; i = i + 1) { // Loop through all the parameters in the keyFrames

			if (!isNaN(parseFloat(startParams[i])) && isFinite(startParams[i])) { // This is a number so use normal easing

				state = CanDo.easing[easing](time); // Get the eased subTime
				if (typeof ctx.p.easing !== 'undefined') { // If the path is eased
					state = CanDo.easing[ctx.p.easing](state);
				}
				result.push((endParams[i] - startParams[i]) * state + startParams[i]); // Add the eased value to the results array

			} else if (typeof startParams[i] === 'string' && (startParams[i].substring(0, 3) === 'rgb' ||  startParams[i].substring(0, 1) === '#')) {  // This is a color
				startColor = CanDo.getRGB(startParams[i]);
				endColor = CanDo.getRGB(endParams[i]);
				stateColor = ctx.easeThis(easing, time, startColor, endColor);
				result.push('rgba(' + Math.floor(Number(stateColor[0])) + ',' + Math.floor(Number(stateColor[1])) + ',' + Math.floor(Number(stateColor[2])) + ',' + Number(stateColor[3]) + ')');

			} else { // This must be a string
				result.push(startParams[i]); // Pass in the value from the start keyframe
			}
		}
		return result;
	};
	
	// Make our canvas methods chainable
	CanDo.each(Object.getPrototypeOf(ctx), function(item, key) {
		ctx[key] = function() { return item.apply(this, arguments) || this; };
	});

	// Initialize our misc properties
	ctx.configure(args);

	// Add event watchers to Canvas element
	CanDo.each(['click', 'mouseover', 'mouseout'], function(name, i) {
		if (el.addEventListener) {
			el.addEventListener(name, function(e) {
				this.ctx.s.eventsQueue[name] = {x:e.offsetX, y:e.offsetY};
				window.console.log(this.ctx.s.eventsQueue);

			}, false);
		} else {
			el.addEventListener('on'+name, function(e) {
				this.ctx.s.eventsQueue.name = {x:e.offsetX, y:e.offsetY};
			}, false);
		}
		
	});

	if (typeof args.init !== 'undefined') {
		args.init(ctx);
	}

	// If we are not loading any images and we want a splash screen
	if (typeof args.images === 'undefined' && ctx.s.splash) {
		ctx.update({time: 0}); // Render at time 0
	}
	
	return ctx;
};
// has from underscore.js
CanDo.has = function(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};
	
// each from underscore.js
CanDo.each = function(obj, iterator, context) {
	if (obj === null) return;
	if (Array.prototype.forEach && obj.forEach) {
		obj.forEach(iterator, context);
	} else if (obj.length === +obj.length) {
		for (var i = 0, l = obj.length; i < l; i++) {
			if (i in obj && iterator.call(context, obj[i], i, obj) === {}) return;
		}
	} else {
		for (var key in obj) {
			if (CanDo.has(obj, key)) {
				if (iterator.call(context, obj[key], key, obj) === {}) return;
			}
		}
	}
};

// Stripped down extend from jQuery
CanDo.extend = function() {
	var options, name, src, copy,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length;

	for ( ; i < length; i++ ) {

		if ( (options = arguments[ i ]) !== null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];
				target[ name ] = copy;
			}
		}
	}
	// Return the modified object
	return target;
};

/******************************************************************************/
/*********************************** EASING ***********************************/
/******************************************************************************/

CanDo.easing = {
	linear: function (p) {
		return p;
	},
	swing: function (p) {
		return (-Math.cos(p * Math.PI) / 2) + 0.5;
	}
};

baseEasings = {
	Sine: function (p) {
		return 1 - Math.cos(p * Math.PI / 2);
	},
	Circ: function (p) {
		return 1 - Math.sqrt(1 - p * p);
	},
	Elastic: function (p) {
		return p === 0 || p === 1 ? p : -Math.pow(2, 8 * (p - 1)) * Math.sin(((p - 1) * 80 - 7.5) * Math.PI / 15);
	},
	Back: function (p) {
		return p * p * (3 * p - 2);
	},
	Bounce: function (p) {
		var pow2,
			bounce = 4;

		while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {}
		return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2);
	}
};

CanDo.each([ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function (name, i) {
	baseEasings[name] = function (p) {
		return Math.pow(p, i + 2);
	};
});

CanDo.each(baseEasings, function (easeIn, name) {
	CanDo.easing["easeIn" + name] = easeIn;
	CanDo.easing["easeOut" + name] = function (p) {
		return 1 - easeIn(1 - p);
	};
	CanDo.easing["easeInOut" + name] = function (p) {
		return p < 0.5 ? easeIn(p * 2) / 2 : easeIn(p * -2 + 2) / -2 + 1;
	};
});
// Parse strings looking for color tuples [255,255,255]
CanDo.getRGB = function (color) {
	var result;
	// Check if we're already dealing with an array of colors
	if (color && color.constructor === Array && (color.length === 3 || color.length === 4)) {
		color.push(1);
		return color;
	}

	// Look for rgba(num,num,num,num)
	if ((result = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9.]{1,3})\s*\)/.exec(color))) {
		return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10), Number(result[4])];
	}

	// Look for rgb(num,num,num)
	if ((result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))) {
		return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10), 1];
	}

	// Look for rgb(num%,num%,num%)
	if ((result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))) {
		return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55, 1];
	}

	// Look for #a0b1c2
	if ((result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))) {
		return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 1];
	}

	// Look for #fff
	if ((result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))) {
		return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16), 1];
	}


	// Look for rgba(0, 0, 0, 0) == transparent in Safari 3
	if ((result = /rgba\(0, 0, 0, 0\)/.exec(color))) {
		return [0, 0, 0, 0];
	}

	// Otherwise, we're most likely dealing with a named color and I don't want them in here
	return [0, 0, 0, 0];
};