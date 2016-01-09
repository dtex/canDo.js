/*The MIT License (MIT)
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

Color Conversion functions from highlightFade
By Blair Mitchelmore
http://jquery.offput.ca/highlightFade/

Easing equations from Robert Penner (http://www.robertpenner.com/easing)
Blatantly lifted from jQuery UI
*/

/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

/**
 * @constructor
 */
var CanDo = function (elid, args) { // this = Window

	"use strict";
	// Hoisted variables
	var el = document.getElementById(elid), ctx, baseEasings, imagesLeftToLoad = 0, colors = { black: [0, 0, 0, 1], blue: [0, 0, 255, 1], green: [0, 128, 0, 1], red: [255, 0, 0, 1], white: [255, 255, 255, 1], transparent: [0, 0, 0, 0]},
		/*aqua: [0, 255, 255, 1], azure: [240, 255, 255, 1], beige: [245, 245, 220, 1], brown: [165, 42, 42, 1], cyan: [0, 255, 255, 1], darkblue: [0, 0, 139, 1], darkcyan: [0, 139, 139, 1], darkgrey: [169, 169, 169, 1], darkgreen: [0, 100, 0, 1], darkkhaki: [189, 183, 107, 1], darkmagenta: [139, 0, 139, 1], darkolivegreen: [85, 107, 47, 1], darkorange: [255, 140, 0, 1], darkorchid: [153, 50, 204, 1], darkred: [139, 0, 0, 1], darksalmon: [233, 150, 122, 1], darkviolet: [148, 0, 211, 1], fuchsia: [255, 0, 255, 1], gold: [255, 215, 0, 1], indigo: [75, 0, 130, 1], khaki: [240, 230, 140, 1], lightblue: [173, 216, 230, 1], lightcyan: [224, 255, 255, 1], lightgreen: [144, 238, 144, 1], lightgrey: [211, 211, 211, 1], lightpink: [255, 182, 193, 1], lightyellow: [255, 255, 224, 1], lime: [0, 255, 0, 1], magenta: [255, 0, 255, 1], maroon: [128, 0, 0, 1], navy: [0, 0, 128, 1], olive: [128, 128, 0, 1], orange: [255, 165, 0, 1], pink: [255, 192, 203, 1], purple: [128, 0, 128, 1], violet: [128, 0, 128, 1], silver: [192, 192, 192, 1], yellow: [255, 255, 0, 1],*/
		imageLoaded = function () {// Called when an image is loaded
			imagesLeftToLoad = imagesLeftToLoad - 1;

			if (imagesLeftToLoad === 0) { // If there are no more images to load
				if (ctx.t.splash) { // If we want a splash screen, render it now
					ctx.update({time: 0});
				}
				ctx.s.loaded = true;
			}
		};

	// Our 2d rendering context
	//if (args.webgl === true) {
	//	ctx = el.getContext('experimental-webgl');
	//} else {
	ctx = el.getContext('2d');
	//}

	/* Default properties of our Canvas timeline */
	ctx.t = { duration: 1000, frameRate: 30, cuePoints: {}, mode: '', wait: true, splash: true, easing: 'linear' };

	// Default status of our playback head
	ctx.s = { time: 0, easedTime: 0, speed: 1.0, startTime: 0, endTime: 0, intervalTimer: 0, loaded: true, height: el.height, width: el.width };

	// Default path status
	ctx.p = {};

	// Handle changes passed in via the configuration object
	ctx.configure = function (args) { // this = ctx
		var imageName, eventName;

		// Update timeline properties
		if (typeof args.duration !== 'undefined') {
			this.t.duration = args.duration;
		}
		if (typeof args.frameRate !== 'undefined') {
			this.t.frameRate = args.frameRate;
		}
		if (typeof args.cuePoints !== 'undefined') {
			this.t.cuePoints = args.cuePoints;
		}
		if (typeof args.mode !== 'undefined') {
			this.t.mode = args.mode;
		}
		if (typeof args.wait !== 'undefined') {
			this.t.wait = args.wait;
		}
		if (typeof args.splash !== 'undefined') {
			this.t.splash = args.splash;
		}
		if (typeof args.easing !== 'undefined') {
			this.t.easing = args.easing;
		}

		// The calculated value of milliseconds between frames
		this.t.frameInterval = Math.floor(1000 / this.t.frameRate);

		// Update playback status properties
		if (typeof args.setTime !== 'undefined') {
			this.s.time = args.setTime;
		}
		if (typeof args.setTime !== 'undefined') {
			this.s.easedTime = args.setTime;
		}
		if (typeof args.speed !== 'undefined') {
			this.s.speed = args.speed;
		}

		// Go through the images and make sure they are loaded before we start drawing
		if (typeof args.images !== 'undefined') { // If an images object was passed
			this.s.loaded = false;
			this.images = args.images;
			for (imageName in this.images) { // Loop through each image
				if (this.images.hasOwnProperty(imageName)) {
					imagesLeftToLoad = imagesLeftToLoad + 1;
					this.images[imageName].img = new Image();
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
			for (eventName in	 args.events) { // Loop through each event
				if (args.events.hasOwnProperty(eventName)) {
					if (el.addEventListener) {
						el.addEventListener(eventName, args.events[eventName], false);
					} else if (el.attachEvent) {
						el.attachEvent('on' + eventName, args.events[eventName]);
					}
				}
			}
		}
	};

	// Begin the animation
	ctx.play = function (args) {

		var preTime; // Used to hold how much time has already passed in the animation

		if (typeof args !== 'undefined') {
			this.configure(args);
		}

		// Calculate our new time values
		this.t.scaledDuration = Math.abs(this.t.duration / this.s.speed); // Calculate the total duration of the timeline
		preTime = this.s.speed < 0 ? 1 - this.s.time : this.s.time; // If we are playing backwards we need to tweak the preTime factor
		this.s.startTime = this.s.time === 0 ? Date.now() : Date.now() - ctx.t.scaledDuration * preTime; // Calculate what our start time is/was on the system clock
		this.s.endTime = this.s.startTime + this.t.scaledDuration; // Calculate our endtime on the system clock

		// Start our interval timer and render the first frame
		this.s.intervalTimer = setInterval(function (context) { context.update(); }, this.t.frameInterval, this);
		this.update();

	};

	// Our refresh function
	ctx.update = function (args) {

		// The next two blocks can be combined
		if (typeof args === 'undefined') { // If args were passed then update our timeline/status
			args = {};
		}

		this.configure(args);

		// Find where we are on the timeline
		if (typeof args.time === 'undefined') {
			if (this.s.speed > 0) {
				this.s.time = (Date.now() - this.s.startTime) / this.t.scaledDuration;
			} else {
				this.s.time = (this.s.endTime - Date.now()) / this.t.scaledDuration;
			}
		} else {
			this.s.time = args.time;
		}

		this.s.easedTime = this.easing[this.t.easing](this.s.time);
		if ((this.s.time < 1.0  && this.s.speed > 0) || (this.s.time > 0  && this.s.speed < 0)) {  // If the animation is not finished

			this.paint(); // Update the canvas and keep on truckin'

		} else { // The animation is finished

			if (this.t.mode === '') { // If we are set to play through one time
				clearInterval(this.s.intervalTimer);
				this.s.time = this.s.speed > 0 ? 1.0 : 0; // Set time to end of animation
				this.s.easedTime = this.s.speed > 0 ? 1.0 : 0; // Set the eased time to end of animation
				this.paint(); // Update the canvas
			}

			if (this.t.mode === 'loop') { // We are set to loop
				this.s.time = this.s.speed > 0 ? 1.0 : 0; // Set time to end of animation
				this.s.easedTime = this.s.speed > 0 ? 1.0 : 0; // Set the eased time to end of animation
				this.paint(); // Update the canvas
				this.s.time = this.s.speed > 0 ? 0 : 1.0; // Set time to the beginning of the animation
				this.s.easedTime = this.s.speed > 0 ? 0 : 1.0; // Set eased time to the beginning of the animation
				this.play({time: 0}); // Play from the beginning
			}
		}
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
				keyFrames[i].cuePoint = this.t.cuePoints[keyFrames[i].cuePoint]; // Get the name value and update the cuepoint so we don't have to do this again
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

		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint; // Calculate the time between our two keyframes
		result.subTime = (this.s.easedTime - keyFrames[result.start].cuePoint) / result.subDuration; // Calculate how far through this transition we are
		return result;
	};

	// Parse strings looking for color tuples [255,255,255]
	ctx.getRGB = function (color) {
		var result;
		// Check if we're already dealing with an array of colors
		if (color && color.constructor === Array && (color.length === 3 || color.length === 4)) {
			color.push(1);
			return color;
		}

		// Look for rgba(num,num,num,num)
		if (result = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9.]{1,3})\s*\)/.exec(color)) {
			return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10), Number(result[4])];
		}

		// Look for rgb(num,num,num)
		if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) {
			return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10), 1];
		}

		// Look for rgb(num%,num%,num%)
		if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color)) {
			return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55, 1];
		}

		// Look for #a0b1c2
		if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color)) {
			return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 1];
		}

		// Look for #fff
		if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)) {
			return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16), 1];
		}


		// Look for rgba(0, 0, 0, 0) == transparent in Safari 3
		if (result = /rgba\(0, 0, 0, 0\)/.exec(color)) {
			return colors.transparent;
		}

		// Otherwise, we're most likely dealing with a named color
		return colors[color.toLowerCase()];
	};

	// Convenience method for resetting the transformation matrix to the identity transform
	ctx.identity = function () {
		this.setTransform(1, 0, 0, 1, 0, 0);
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
		return result;
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
	};

	// Here's our path wrapper
	ctx.canBeginPath = function (pathConfig) {
		if (typeof pathConfig !== 'undefined') {
			if (typeof pathConfig.easing !== 'undefined') {
				ctx.p.easing = pathConfig.easing;
			}
		}
		this.beginPath();
	};

	ctx.canClosePath = function () {
		ctx.p = {};
		this.closePath();
	}

	// This is our easing wrapper
	ctx.easeThis = function (easing, time, startParams, endParams) {

		var i,  j = startParams.length, result = [], state, startColor, endColor, stateColor;
		for (i = 0; i < j; i = i + 1) { // Loop through all the parameters in the keyFrames

			if (!isNaN(parseFloat(startParams[i])) && isFinite(startParams[i])) { // This is a number so use normal easing

				state = ctx.easing[easing](time); // Get the eased subTime
				if (typeof ctx.p.easing !== 'undefined') { // If the path is eased
					state = ctx.easing[ctx.p.easing](state);
				}
				result.push((endParams[i] - startParams[i]) * state + startParams[i]); // Add the eased value to the results array

			} else if (typeof startParams[i] === 'string' && (startParams[i].substring(0, 3) === 'rgb' ||  startParams[i].substring(0, 1) === '#')) {  // This is a color
				startColor = ctx.getRGB(startParams[i]);
				endColor = ctx.getRGB(endParams[i]);
				stateColor = ctx.easeThis(easing, time, startColor, endColor);
				result.push('rgba(' + Math.floor(Number(stateColor[0])) + ',' + Math.floor(Number(stateColor[1])) + ',' + Math.floor(Number(stateColor[2])) + ',' + Number(stateColor[3]) + ')');

			} else { // This must be a string
				result.push(startParams[i]); // Pass in the value from the start keyframe
			}
		}
		return result;
	};

	// Stripped down each from jQuery. Does not test for functions
	ctx.each = function (object, callback) {
		var name, i,
			length = object.length,
			isObj = length === undefined;

		if (isObj) { // if an object was passed in
			for (name in object) {
				if (object.hasOwnProperty(name)) {
					if (callback.call(object[name], name, object[name]) === false) {
						break;
					}
				}
			}
		} else { // an array was passed in
			for (i = 0; i < length; i = i + 1) {
				if (callback.call(object[i], i, object[i]) === false) {
					break;
				}
			}
		}
	};

	/******************************************************************************/
	/*********************************** EASING ***********************************/
	/******************************************************************************/

	ctx.easing = {
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

	ctx.each([ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function (i, name) {
		baseEasings[name] = function (p) {
			return Math.pow(p, i + 2);
		};
	});

	ctx.each(baseEasings, function (name, easeIn) {
		ctx.easing["easeIn" + name] = easeIn;
		ctx.easing["easeOut" + name] = function (p) {
			return 1 - easeIn(1 - p);
		};
		ctx.easing["easeInOut" + name] = function (p) {
			return p < 0.5 ? easeIn(p * 2) / 2 : easeIn(p * -2 + 2) / -2 + 1;
		};
	});

	// Initialize our misc properties
	ctx.configure(args);

	if (typeof args.init !== 'undefined') {
		args.init(ctx);
	}

	// If we are not loading any images and we want a splash screen
	if (typeof args.images === 'undefined' && ctx.t.splash) {
		ctx.update({time: 0}); // Render at time 0
	}

	return ctx;
};
