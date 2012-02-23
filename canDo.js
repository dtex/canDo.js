var canDo = function(el, args){
	
	// Our 2d rendering context
	var ctx  = el.getContext('2d'); 
	
	/* Properties of our Canvas timeline with some defaults. They are not specific to any method call */ 
	ctx.t = { // t=timeLine
		duration: args.duration ? args.duration : 1000,	 // Timeline duration in 1/1000 seconds
		frameRate: args.frameRate ? args.frameRate : 30, // Our target framerate
		cuePoints: args.cuePoints ? args.cuePoints : {}, // Our list of cuepoints
		mode: args.mode ? args.mode : '' // Playback mode ('' = Play 1x, 'loop')
	};

	// The calculated value of milliseconds between frames
	ctx.t.frameInterval = Math.floor(1000 / ctx.t.frameRate);		
	
	// Properties of our playback head
	ctx.s = { // s=status
		time: args.setTime ? args.setTime : 0, // Setting the playback head position on the timeline (0.0 - 1.0)
		speed: args.playbackSpeed ? args.playbackSpeed : 1.0, // For stretching the timeline (still in development)
		startTime: 0,	 // The start time of the current play event (calculated on play)
		endTime: 0, // The end time of the current play event (calculated on play)
		intervalTimer: 0 // The setInterval used for refresh
	}
	
	// Yeah, we're gonna need this
	ctx.paint = args.paint;
	
	// Event handlers
	if (args.click) { // If a click function was passed
		if (el.addEventListener){
			el.addEventListener('click', args.click, false);   
		} else if (el.attachEvent){  
			el.attachEvent('onclick', args.click);  
		}
	}
	
	// Begin the animation
	ctx.play = function(args) {
		var preTime; // Used to hold how much time has already passed in the animation
		
		if (args === undefined) args = {}; // We can pass in args to our play function as well
		if (!(typeof args.speed === 'undefined')) ctx.s.speed = args.speed; // Update with new speed if speed property was passed
		if (!(typeof args.time === 'undefined')) {ctx.s.time = args.time;} // Update the playback head position if time property was passed
		if (!(typeof args.mode === 'undefined')) {ctx.t.mode = args.mode;} // Update the playback head position if time property was passed
		
		// Calculate our new time values
		ctx.t.scaledDuration = Math.abs(ctx.t.duration / ctx.s.speed); // Calculate the total duration of the timeline
		ctx.s.speed < 0 ? preTime = 1 - ctx.s.time : preTime = ctx.s.time; // If we are playing backwards we need to tweak our formula
		ctx.s.time == 0 ? ctx.s.startTime = Date.now() : ctx.s.startTime = Date.now() - ctx.t.scaledDuration * preTime; // Calculate what our start time is/was on the real clock
		ctx.s.endTime = ctx.s.startTime + ctx.t.scaledDuration; // Calculate our endtime on the real clock
		
		// Start our interval timer and render the first frame
		ctx.s.intervalTimer = setInterval (function() { ctx.update(); }, ctx.t.frameInterval); 
		ctx.update();
	}
	
	// Our refresh function
	ctx.update = function() {
		
		// Find where we are on the timeline
		if (ctx.s.speed > 0) {
			ctx.s.time = (Date.now() - ctx.s.startTime) / ctx.t.scaledDuration;
		} else {
			ctx.s.time = (ctx.s.endTime - Date.now()) / ctx.t.scaledDuration;
		}
		
		if ((ctx.s.time < 1.0  && ctx.s.speed > 0) | (ctx.s.time > 0  && ctx.s.speed < 0)) {  // If the animation is not finished
			
			ctx.paint(); // Update the canvas and keep on truckin'
			
		} else { // The animation is finished
			
			if (ctx.t.mode == '') { // If we are set to play through one time
				clearInterval(ctx.s.intervalTimer); // Cancel the refresh interval timer
				ctx.s.speed > 0 ? ctx.s.time = 1.0 : ctx.s.time = 0; // Set time to end of animation
				ctx.paint(); // Update the canvas
			}
			
			if (ctx.t.mode == 'loop') { // We are set to loop
				ctx.s.speed > 0 ? ctx.s.time = 1.0 : ctx.s.time = 0; // Set time to end of animation
				ctx.paint(); // Update the canvas
				ctx.s.speed > 0 ? ctx.s.time = 0 : ctx.s.time = 1.0; // Set time to the beginning of the animation
				ctx.play({time:0}); // Play from the beginning
			}
		}
	}
	
	// Find out which keyframes we are using (definitely room for improvement here)
	ctx.getCurrentKeyframe = function (keyFrames) {
		var result = {}; // Our result object
		if (ctx.s.speed >= 0) {
			result.start = 0, result.end = 1; // Initial values
		} else {
			result.start = keyFrames.length - 2, result.end = keyFrames.length - 1; // Initial values
		}
		for (i=0, j= keyFrames.length;i<j;i++) { //Loop through the keyframes
			if ( typeof( keyFrames[i].cuePoint) === "string") { // If they keyframe was passed as a name
				keyFrames[i].cuePoint = ctx.t.cuePoints[keyFrames[i].cuePoint]; // Get the name value and update the cuepoint so we don't have to do this again
			}
			if (keyFrames[i].cuePoint < ctx.s.time) { // If this cuepoint occurs before the current time
				result.start = i;result.end = i+1; // This could be our cuepoint (might be replaced later in our loop)
			}
		}
		result.subDuration = keyFrames[result.end].cuePoint - keyFrames[result.start].cuePoint; // Calculate the time between our two keyframes
		result.subTime = Math.pow(ctx.s.time - keyFrames[result.start].cuePoint, 2) / result.subDuration; // Calculate how far through this transition we are
		return result;
	}
	
	// Convenience method for resetting the transformation matrix to the identity transform
	ctx.identity = function() { 
    	this.setTransform(1, 0, 0, 1, 0, 0); 
	}

	// Here's our wrapper
	ctx.canDo = function(method, keyFrames) {
		var beg = ctx.getCurrentKeyframe(keyFrames); // Find the start point for the current animation segment
		var state = ctx.easing[keyFrames[beg.end].easing](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration); // Call our easing function passing in our array of parameters and getting an array in return
		result = ctx[method].apply(this, state); // Call the proxied function with the computed parameters
		return result;
	};
	
	ctx.canSet = function(property, keyFrames) {
		var beg = ctx.getCurrentKeyframe(keyFrames); // Find the start point for the current animation segment
		var result = ctx.easing[keyFrames[beg.end].easing](beg.bounces, beg.subTime, keyFrames[beg.start].params, keyFrames[beg.end].params, beg.subDuration); // Call our easing function passing in our array of parameters and getting an array in return
		ctx[property] = result[0]; // Call the proxied function with the computed parameters
	};
  
	/* These functions are based on easing equations from jQuery UI
	 * Copyright 2001 Robert Penner
	 * They've been modified to accept beginning and change values in arrays and return an array result
	 * t: current time, b: begInnIng value, c: change In value, d: duration */
	
	ctx.easing = {
		
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
		
	}	
	return ctx;
};