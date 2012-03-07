/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

var CanDo = function (el, args) {
	"use strict";

	// Our 2d rendering context
	var ctx  = el.getContext('2d'), imagesLeftToLoad = 0, imageName, eventName,
		imageLoaded = function () {// Called when an image is loaded
			imagesLeftToLoad = imagesLeftToLoad - 1; 

			if (imagesLeftToLoad === 0) { // If there are no more images to load
				if (ctx.t.splash) { // If we want a splash screen, render it now
					ctx.update({time: 0});
				}
				ctx.s.loaded = true; // Inidicate that all images are loaded
			}
		};

	/* Default properties of our Canvas timeline. They are not specific to any method call */
	ctx.t = { duration: 1000, frameRate: 30, cuePoints: {}, mode: '', wait: true, splash: true, easing: 'linear' };

	// Default properties of our playback head
	ctx.s = { time: 0, easedTime: 0, speed: 1.0, startTime: 0,	 endTime: 0, intervalTimer: 0, loaded: true };

	// Handle changes passed in via the configuration object
	ctx.configure = function (args) {
		var preTime; // Used to hold how much time has already passed in the animation
		
		// Update timeline properties
		if (typeof args.duration !== 'undefined') ctx.t.duration = args.duration;
		if (typeof args.frameRate !== 'undefined') ctx.t.frameRate = args.frameRate;
		if (typeof args.cuePoints !== 'undefined') ctx.t.cuePoints = args.cuePoints;
		if (typeof args.mode !== 'undefined') ctx.t.mode = args.mode;
		if (typeof args.wait !== 'undefined') ctx.t.wait = args.wait;
		if (typeof args.splash !== 'undefined') ctx.t.splash = args.splash;
		if (typeof args.easing !== 'undefined') ctx.t.easing = args.easing;
		
		// The calculated value of milliseconds between frames
		ctx.t.frameInterval = Math.floor(1000 / ctx.t.frameRate);
		
		// Update playback status properties
		if (typeof args.setTime !== 'undefined') ctx.s.time = args.setTime;
		if (typeof args.setTime !== 'undefined') ctx.s.easedTime = args.setTime;
		if (typeof args.speed !== 'undefined') ctx.s.speed = args.speed;
		
		// Calculate our new time values
		ctx.t.scaledDuration = Math.abs(ctx.t.duration / ctx.s.speed); // Calculate the total duration of the timeline
		preTime = ctx.s.speed < 0 ? 1 - ctx.s.time : ctx.s.time; // If we are playing backwards we need to tweak our formula
		ctx.s.startTime = ctx.s.time === 0 ? Date.now() : Date.now() - ctx.t.scaledDuration * preTime; // Calculate what our start time is/was on the real clock
		ctx.s.endTime = ctx.s.startTime + ctx.t.scaledDuration; // Calculate our endtime on the real clock

		// Start our interval timer and render the first frame
		ctx.s.intervalTimer = setInterval(function () { ctx.update(); }, ctx.t.frameInterval);
		ctx.update();
		
		// Go through the images and make sure they are loaded before we start drawing
		if (typeof args.images !== 'undefined') { // If an images object was passed
			ctx.s.loaded = false; // Indicate that images are not ready
			ctx.images = args.images; // Copy the images from args to the context
			for (imageName in ctx.images) { // Loop through each image
				if (ctx.images.hasOwnProperty(imageName)) {
					imagesLeftToLoad = imagesLeftToLoad + 1; // We have one more image to load
					ctx.images[imageName].img = new Image(); // Add an image to the image object
					ctx.images[imageName].img.onload = imageLoaded;
					ctx.images[imageName].img.src = ctx.images[imageName].url; // Set the src for the image to start loading it
				}
			}
		}
		
		// Yeah, we're gonna need this
		if (typeof args.paint !== 'undefined') ctx.paint = args.paint;
	
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
		if (typeof args !== 'undefined') {
			ctx.configure(args);
		}
	};

	// Our refresh function
	ctx.update = function (args) {
		if (typeof args === 'undefined') {
			args = {};
		}
		
		ctx.configure(args);

		// Find where we are on the timeline
		if (typeof args.time === 'undefined') {
			if (ctx.s.speed > 0) {
				ctx.s.time = (Date.now() - ctx.s.startTime) / ctx.t.scaledDuration;
			} else {
				ctx.s.time = (ctx.s.endTime - Date.now()) / ctx.t.scaledDuration;
			}
		} else {
			ctx.s.time = args.time;
		}

		ctx.s.easedTime = ctx.easing[ctx.t.easing](0, ctx.s.time, [0], [1], 1)[0];

		if ((ctx.s.time < 1.0  && ctx.s.speed > 0) || (ctx.s.time > 0  && ctx.s.speed < 0)) {  // If the animation is not finished

			ctx.paint(); // Update the canvas and keep on truckin'

		} else { // The animation is finished

			if (ctx.t.mode === '') { // If we are set to play through one time
				clearInterval(ctx.s.intervalTimer); // Cancel the refresh interval timer
				ctx.s.time = ctx.s.speed > 0 ? 1.0 : 0; // Set time to end of animation
				ctx.s.easedTime = ctx.s.speed > 0 ? 1.0 : 0; // Set time to end of animation
				ctx.paint(); // Update the canvas
			}

			if (ctx.t.mode === 'loop') { // We are set to loop
				ctx.s.time = ctx.s.speed > 0 ? 1.0 : 0; // Set time to end of animation
				ctx.s.easedTime = ctx.paint(); // Update the canvas
				ctx.s.time = ctx.s.speed > 0 ? 0 : 1.0; // Set time to the beginning of the animation
				ctx.s.easedTime = ctx.s.speed > 0 ? 0 : 1.0; // Set time to the beginning of the animation
				ctx.play({time: 0}); // Play from the beginning
			}
		}
	};

	// Find out which keyframes we are using (definitely room for improvement here)
	ctx.getCurrentKeyframe = function (keyFrames) {

		var i, j, result = { start: 0, end: 1}; // Our result object

		for (i = 0, j = keyFrames.length; i < j; i = i + 1) { //Loop through the keyframes
			if (typeof (keyFrames[i].cuePoint) === "string") { // If they keyframe was passed as a name
				keyFrames[i].cuePoint = ctx.t.cuePoints[keyFrames[i].cuePoint]; // Get the name value and update the cuepoint so we don't have to do this again
			}
			if (keyFrames[i].cuePoint < ctx.s.easedTime) { // If this cuepoint occurs before the current time
				result.start = i;
				result.end = i + 1; // This could be our cuepoint (might be replaced later in our loop)
			}
		}

		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint; // Calculate the time between our two keyframes
		result.subTime = Math.pow(ctx.s.easedTime - keyFrames[result.start].cuePoint, 2) / result.subDuration; // Calculate how far through this transition we are
		return result;
	};

	// Convenience method for resetting the transformation matrix to the identity transform
	ctx.identity = function () {
		this.setTransform(1, 0, 0, 1, 0, 0);
	};

	// Here's our method wrapper
	ctx.canDo = function (method, keyFrames) {
		var beg = ctx.getCurrentKeyframe(keyFrames), // Find the start point for the current animation segment
			state = ctx.easing[keyFrames[beg.end].easing || 'linear'](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration), // Call our easing function passing in our array of parameters and getting an array in return
			result = ctx[method].apply(this, state); // Call the proxied function with the computed parameters
		return result;
	};

	ctx.canSet = function (property, keyFrames) {
		var beg = ctx.getCurrentKeyframe(keyFrames), // Find the start point for the current animation segment
			result = ctx.easing[keyFrames[beg.end].easing || 'linear'](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration); // Call our easing function passing in our array of parameters and getting an array in return
		ctx[property] = result[0]; // Call the proxied function with the computed parameters
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
	
	if (typeof args.images === 'undefined' && ctx.t.splash) {
		ctx.update({time: 0});
	}

	return ctx;
};