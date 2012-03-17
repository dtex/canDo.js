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
*/

/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

var CanDo = function (el, args) { // this = Window

	"use strict";
	// Hoisted variables
	var ctx, imagesLeftToLoad = 0,
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
	if (args.webgl === true) {
		ctx = el.getContext('experimental-webgl');
	} else {
		ctx = el.getContext('2d');
	}


	/* Default properties of our Canvas timeline. They are not specific to any method call */
	ctx.t = { duration: 1000, frameRate: 30, cuePoints: {}, mode: '', wait: true, splash: true, easing: 'linear' };

	// Default status of our playback head
	ctx.s = { time: 0, easedTime: 0, speed: 1.0, startTime: 0,	 endTime: 0, intervalTimer: 0, loaded: true, height: el.height, width: el.width };

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

		this.s.easedTime = this.easing[this.t.easing](0, this.s.time, [0], [1], 1)[0];

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
				this.s.easedTime = this.paint(); // Update the canvas
				this.s.time = this.s.speed > 0 ? 0 : 1.0; // Set time to the beginning of the animation
				this.s.easedTime = this.s.speed > 0 ? 0 : 1.0; // Set eased time to the beginning of the animation
				this.play({time: 0}); // Play from the beginning
			}
		}
	};

	// Find out which keyframes we are using (definitely room for improvement here)
	ctx.getCurrentKeyframe = function (keyFrames) {

		var i, j, result = { start: 0, end: 1}; // Our result object

		for (i = 0, j = keyFrames.length; i < j; i = i + 1) { //Loop through the keyframes
			if (typeof (keyFrames[i].cuePoint) === "string") { // If they keyframe was passed as a name
				keyFrames[i].cuePoint = this.t.cuePoints[keyFrames[i].cuePoint]; // Get the name value and update the cuepoint so we don't have to do this again
			}
			if (keyFrames[i].cuePoint < this.s.easedTime) { // If this cuepoint occurs before the current time
				result.start = i;
				result.end = i + 1; // This could be our cuepoint (might be replaced later in our loop)
			}
		}

		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint; // Calculate the time between our two keyframes
		result.subTime = Math.pow(this.s.easedTime - keyFrames[result.start].cuePoint, 2) / result.subDuration; // Calculate how far through this transition we are
		return result;
	};

	// Convenience method for resetting the transformation matrix to the identity transform
	ctx.identity = function () {
		this.setTransform(1, 0, 0, 1, 0, 0);
	};

	// Here's our method wrapper
	ctx.canDo = function (method, keyFrames) {
		var beg = this.getCurrentKeyframe(keyFrames), // Find the start point for the current animation segment
			state = this.easing[keyFrames[beg.end].easing || 'linear'](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration), // Call our easing function passing in our array of parameters and getting an array in return
			result = this[method].apply(this, state); // Call the proxied function with the computed parameters
		return result;
	};

	ctx.canSet = function (property, keyFrames) {
		var beg = this.getCurrentKeyframe(keyFrames), // Find the start point for the current animation segment
			result = this.easing[keyFrames[beg.end].easing || 'linear'](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration); // Call our easing function passing in our array of parameters and getting an array in return
		this[property] = result[0]; // Call the proxied function with the computed parameters
	};

	/* These functions are based on easing equations from jQuery UI
	 * Copyright 2001 Robert Penner
	 * They've been modified to accept beginning and change values in arrays and return an array result
	 * t: current time, b: begInnIng value, c: change In value, d: duration */

	ctx.easing = {
		linear: function (x, t, b, c, d) {
			var k, l, result = [];
			for (k = 0, l = b.length; k < l; k = k + 1) {
				result.push((t / d) * (c[k] - b[k]) + b[k]);
			}
			return result;
		},
		swing: function (x, t, b, c, d) {
			var k, l, result = [], v = ((-Math.cos(t / d * Math.PI) / 2) + 0.5);
			for (k = 0, l = b.length; k < l; k = k + 1) {
				result.push(v * (c[k] - b[k]) + b[k]);
			}
			return result;
		},
		easeInQuad: function (x, t, b, c, d) {
			var k, l, result = [], v = Math.pow(t / d, 2);
			for (k = 0, l = b.length; k < l; k = k + 1) {
				result.push((c[k] - b[k]) * v + b[k]);
			}
			return result;
		},

		easeOutQuad: function (x, t, b, c, d) {
			var k, l, result = [], v = (t / d) * (t / d - 2);
			for (k = 0, l = b.length; k < l; k = k + 1) {
				result.push(-(c[k] - b[k]) * v + b[k]);
			}
			return result;
		},

		easeInOutQuad: function (x, t, b, c, d) {
			var w, k, l, result = [], v = t / (d / 2);
			for (k = 0, l = b.length; k < l; k = k + 1) {
				w = (c[k] - b[k]) / 2;
				if (v < 1) {
					result.push(w * v * v + b[k]);
				} else {
					result.push(-1 *  w * ((v - 1) * (v - 3) - 1) + b[k]);
				}
			}
			return result;
		}

	};

	ctx.configure(args);

	if (typeof args.init !== 'undefined') {
		args.init(ctx);
	}

	if (typeof args.images === 'undefined' && ctx.t.splash) {
		ctx.update({time: 0});
	}

	return ctx;
};