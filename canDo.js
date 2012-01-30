var canDo = function(el, args){
	
	if (!args) args = {};
	
	var ctx  = el.getContext('2d')
	
	ctx.VERSION = '0.0.1';
	ctx.DateObj = new Date();
	
	ctx.timeLine = {
		duration: args.duration ? args.duration : 1000,
		frameRate: args.frameRate ? args.frameRate : 30,
		frameInterval : 0,
		cuePoints: args.cuePoints ? args.cuePoints : {},
		mode: 1
	};
	
	
	if (!ctx.timeLine.start) ctx.timeLine.start = 0;
	if (!ctx.timeLine.end) ctx.timeLine.end = ctx.timeLine.duration;
	ctx.timeLine.frameInterval = Math.floor(1000 / ctx.timeLine.frameRate);

	
	ctx.status = {
		time: args.setTime ? args.setTime : 0,
		speed: args.playbackSpeed ? args.playbackSpeed : 1.0,
		startTime: 0,
		endTime: 0,
		intervalTimer: 0
	}
	
	ctx.timeLine.scaledDuration = ctx.timeLine.duration / ctx.status.speed;
	
	ctx.controller = {
		paint: args.paint ? args.paint : function() {}
	}
	
	ctx.paint = function() {
		ctx.controller.paint();
	}
	
	ctx.play = function(args) {
		if (!args) args = {};
		if (args.speed) ctx.status.speed = args.speed;
		if (args.time) ctx.status.time = args.time;
		ctx.timeLine.scaledDuration = ctx.timeLine.duration / ctx.status.speed; 
		ctx.status.time == 0 ? ctx.status.startTime = Date.now() : ctx.status.startTime = Date.now() - ctx.timeLine.scaledDuration * ctx.status.speed /  ctx.status.time;
		ctx.status.endTime = ctx.status.startTime + ctx.timeLine.scaledDuration;
		ctx.status.intervalTimer = setInterval (function() { ctx.update(); }, ctx.timeLine.frameInterval);
		ctx.controller.paint();
		ctx.update();
	}
	
	ctx.update = function() {
		ctx.status.time = (Date.now() - ctx.status.startTime) / ctx.timeLine.scaledDuration;
		if (ctx.status.time < 1.0) {
			ctx.status.time = (Date.now() - ctx.status.startTime ) / ctx.timeLine.scaledDuration / ctx.status.speed;
			ctx.controller.paint();
		} else {
			ctx.status.time = 1.0;
			ctx.controller.paint();
			ctx.status.time = 0;
			clearInterval(ctx.status.intervalTimer);
		}
	}
	
	ctx.canDoFillRect = function(keyFrames) {
		var value, start = 0, end = 1;
		for (i=1, j= keyFrames.length;i<j;i++) {
			if (keyFrames[i].cuePoint < ctx.status.time) {
				start = i;end = i+1;
			}
		}
		var subDuration = keyFrames[end].cuePoint - keyFrames[start].cuePoint;
		var subTime = ctx.status.time - keyFrames[start].cuePoint;
		var subSubTime = subTime / subDuration;
		var changeInValue = keyFrames[end].params[0] - keyFrames[start].params[0];
		ctx.fillRect(
			ctx.easing.easeInQuad(0, subTime*subSubTime, keyFrames[start].params[0], keyFrames[end].params[0] - keyFrames[start].params[0], subDuration),
			ctx.easing.easeInQuad(0, subTime*subSubTime, keyFrames[start].params[1], keyFrames[end].params[1] - keyFrames[start].params[1], subDuration),
			ctx.easing.easeInQuad(0, subTime*subSubTime, keyFrames[start].params[2], keyFrames[end].params[2] - keyFrames[start].params[2], subDuration),
			ctx.easing.easeInQuad(0, subTime*subSubTime, keyFrames[start].params[3], keyFrames[end].params[3] - keyFrames[start].params[3], subDuration)	
		);
	};
	
	/******************************************************************************/
	/*********************************** EASING ***********************************/
	/******************************************************************************/
	
	/*
	 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
	 *
	 * Uses the built in easing capabilities added In jQuery 1.1
	 * to offer multiple easing options
	 *
	 * TERMS OF USE - jQuery Easing
	 *
	 * Open source under the BSD License.
	 *
	 * Copyright 2008 George McGinley Smith
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without modification,
	 * are permitted provided that the following conditions are met:
	 *
	 * Redistributions of source code must retain the above copyright notice, this list of
	 * conditions and the following disclaimer.
	 * Redistributions in binary form must reproduce the above copyright notice, this list
	 * of conditions and the following disclaimer in the documentation and/or other materials
	 * provided with the distribution.
	 *
	 * Neither the name of the author nor the names of contributors may be used to endorse
	 * or promote products derived from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
	 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
	 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
	 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
	 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
	 * OF THE POSSIBILITY OF SUCH DAMAGE.
	 *
	*/
	
	// t: current time, b: begInnIng value, c: change In value, d: duration

	ctx.easing = {
		def: "easeOutQuad",
		swing: function ( x, t, b, c, d ) {
			return $.easing[ $.easing.def ]( x, t, b, c, d );
		},
		easeInQuad: function ( x, t, b, c, d ) {
			return c * ( t /= d ) * t + b;
		},
		easeOutQuad: function ( x, t, b, c, d ) {
			return -c * ( t /= d ) * ( t - 2 ) + b;
		},
		easeInOutQuad: function ( x, t, b, c, d ) {
			if ( ( t /= d / 2 ) < 1 ) return c / 2 * t * t + b;
			return -c / 2 * ( ( --t ) * ( t-2 ) - 1) + b;
		},
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
		}
	}
	
	/*
	 *
	 * TERMS OF USE - EASING EQUATIONS
	 *
	 * Open source under the BSD License.
	 *
	 * Copyright 2001 Robert Penner
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without modification,
	 * are permitted provided that the following conditions are met:
	 *
	 * Redistributions of source code must retain the above copyright notice, this list of
	 * conditions and the following disclaimer.
	 * Redistributions in binary form must reproduce the above copyright notice, this list
	 * of conditions and the following disclaimer in the documentation and/or other materials
	 * provided with the distribution.
	 *
	 * Neither the name of the author nor the names of contributors may be used to endorse
	 * or promote products derived from this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
	 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
	 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
	 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
	 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED
	 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
	 * OF THE POSSIBILITY OF SUCH DAMAGE.
	 *
	 */
	
	
	return ctx;
};