var canDo = function(el, args){
	
	// Our 2d rendering context
	var ctx  = el.getContext('2d'); 
	
	if (!args) args = {};
	ctx.canDoVERSION = '0.0.1';
	
	
	/* Properties of our Canvas timeline with some defaults. They are not specific to any method call */ 
	ctx.timeLine = {
		duration: args.duration ? args.duration : 1000,			// Timeline duration in 1/1000 seconds
		frameRate: args.frameRate ? args.frameRate : 30,		// Our target framerate
		frameInterval : 30,										// Milliseconds between frames (recalculated below)
		cuePoints: args.cuePoints ? args.cuePoints : {},		// Our list of cuepoints
		mode: args.mode ? args.mode: 1													// Playback mode (1 = 1x, 0 = loop, -1 = back and forth)
	};

	// The calculated value of milliseconds between frames
	ctx.timeLine.frameInterval = Math.floor(1000 / ctx.timeLine.frameRate);		
	
	// Properties of our playback head
	ctx.status = {
		time: args.setTime ? args.setTime : 0,					// Setting the playback head position on the timeline (0.0 - 1.0)
		speed: args.playbackSpeed ? args.playbackSpeed : 1.0, 	// For stretching the timeline (sill in development)
		startTime: 0,											// The start time of the current play event (calculated on play)
		endTime: 0,												// The end time of the current play event (calculated on play)
		intervalTimer: 0 										// The setInterval used for refresh
	}
	
	// Convenience function
	ctx.paint = args.paint;
	
	// Begin the animation
	ctx.play = function(args) {
		
		if (!args) args = {};
		if (args.speed) ctx.status.speed = args.speed;			// Update with new speed if speed property was passed
		if (args.time) ctx.status.time = args.time;				// Update the playback head position if time property was passed
		
		// Calculate new values
		ctx.timeLine.scaledDuration = ctx.timeLine.duration / ctx.status.speed; 
		ctx.status.time == 0 ? ctx.status.startTime = Date.now() : ctx.status.startTime = Date.now() - ctx.timeLine.scaledDuration * ctx.status.speed /  ctx.status.time;
		ctx.status.endTime = ctx.status.startTime + ctx.timeLine.scaledDuration;
		
		// Start our interval timer and render the first frame
		ctx.status.intervalTimer = setInterval (function() { ctx.update(); }, ctx.timeLine.frameInterval);
		ctx.update();
	}
	
	// Our refresh function
	ctx.update = function() {
		
		// Find where we are on the timeline
		ctx.status.time = (Date.now() - ctx.status.startTime) / ctx.timeLine.scaledDuration;
		
		// this conditional needs to change to support playing backwards
		if (ctx.status.time < 1.0) { 							// If the animation is not finished
			
			ctx.paint();										// Update the canvas and keep on truckin'
			
		} else { 												// The animation is finished
			
			if (ctx.timeLine.mode == 1) {						// If we are set to play through one time
				clearInterval(ctx.status.intervalTimer);		// Cancel the refresh interval timer
				ctx.status.time = 1.0;							// Set time to end of animation
				ctx.paint();									// Update the canvas
			}
			
			if (ctx.timeLine.mode == -1) {
				// Probably need to write this now
			}
			
			if (ctx.timeLine.mode == 999) {						// We are set to loop
				ctx.status.time = 0;							// Set time to the beginning of the animation
				ctx.play({time:0});								// Play from the beginning
			}
		}
	}
	
	ctx.canDoFillRect = function(keyFrames) {
		var start = 0, end = 1;
		for (i=0, j= keyFrames.length;i<j;i++) {
			if (keyFrames[i].cuePoint < ctx.status.time) {
				start = i;end = i+1;
			}
		}
		var subDuration = keyFrames[end].cuePoint - keyFrames[start].cuePoint;
		var subTime = Math.pow(ctx.status.time - keyFrames[start].cuePoint, 2) / subDuration;
		var bounces = 0
		var result = ctx.easing[keyFrames[end].easing](bounces, subTime, keyFrames[start].params, keyFrames[end].params, subDuration);
		ctx.fillRect(result[0], result[1], result[2], result[3]);
	};
	
	/* These functions are based on easing equations from jQuery UI
	 * Copyright 2001 Robert Penner
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