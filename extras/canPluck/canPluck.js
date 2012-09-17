var plucked = {};

pluck = function( lib ) {
	var functions = [],
		ignoredLines = ["this.initialize()"],	
		myUL = jQuery("body").append('<ul id="shapes" />'),
		shapes = jQuery("#shapes"),
		prefix = "plucked.";
		
	jQuery.each(lib, function( key, obj) {
		shapes.append("<li>"+key+"</li>");
	});
	
	shapes.on("click", "li", function(e) {
		// split the text of the function on ; or newline into an array
		parse(jQuery(this).html());
	});
	
	parse = function(name) {
		var func = lib[name].toString().split(/[\;|\n|\t]/),
			newFunc = [],
			inShape = false,
			shapeName = "";
		
		// remove the wrapping function
		func.shift()
		func.pop();
		
		// remove empty lines, comments and ignoredLines
		jQuery.each(func, function (index, value) {
			value.trim;
			if (value !== '' && value.substring(0,2) !== '//' && ignoredLines.indexOf(value) === -1) {
				if (!(value.match(/this\.initialize/))) {
					newFunc.push(value);
				}
			}
		});
		
		jQuery.each(newFunc, function (index, value) {
			
			// convert new lib elements to function calls
			if (value.indexOf(' = new lib.') !== -1) {
				r = value.match(/(new lib\.)([^\(]+)/);
				newFunc[index] = prefix + r[2] + '(ctx)';
				if (functions.indexOf(r[2]) === - 1 && typeof plucked[r[2]] === 'undefined') {
					functions.push(r[2]);
				}
			}
			
			// convert shadows to canDoShadows
			if (value.indexOf('new Shadow') !== -1) {
				r = value.match(/(new Shadow)(\([^\)]+\))/);
				newFunc[index] = "ctx.canShadow"+r[2];
			}
			
			// detect new shape
			if (value.indexOf('new Shape()') !== -1) {
				r = value.match(/(this\.)([^ ]+)/);
				value = shapeName !== "" ? "ctx.canClosePath();ctx.canBeginPath()" : "ctx.canBeginPath()";
				shapeName = r[2];
				newFunc[index] = value;
			}
			
			if (value.indexOf('.graphics.') !== -1) {
				r = value.match(/(.+)\.graphics\.(.+)/);
				value = "ctx."+r[2];
				value = value.replace(/beginFill/gi, "canFill");
				value = value.replace(/curveTo/gi, "canCurveTo");
				value = value.replace(/lineTo/gi, "canLineTo");
				value = value.replace(/moveTo/gi, "canMoveTo");
				newFunc[index] = value;
			}
			
			if (value.indexOf('this.'+shapeName) !== -1) {
				value = value.replace('this.'+shapeName, 'ctx');
				newFunc[index] = value;
			}
			
			if (value.indexOf('addTween') !== -1) {
				newFunc[index] = "";
			}
			
		});
		
		newFunc = prefix+name+ " = function( ctx) { "+ newFunc.join(";\n") + "};";

		try {
			result = eval(newFunc);
		} catch (e) {
			console.log('Unable to evaluate '+name);
		}
		
		if ( functions.length === 0 ) {
			console.dir(plucked);
		} else {
			parse (functions.pop());
		}
	}
}