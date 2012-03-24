var drawJSBox = function(ctx) {
	ctx.beginPath();ctx.clearRect(0,0,210,210);ctx.fillStyle = "rgb(247,223,30)";ctx.fillRect(0,0,210,210);
}
var drawJ = function(ctx) {
	ctx.fillStyle = "rgb(0,0,0)";ctx.moveTo(94.66,164.33);ctx.lineTo(94.66,96.66);ctx.lineTo(114,96.66);ctx.lineTo(114,164.33);ctx.bezierCurveTo(114,179.33,106.66,193.33,84.66,193.33);ctx.bezierCurveTo(62.66,193.33,55.33,176,55.33,176);ctx.lineTo(71.33,166);ctx.bezierCurveTo(71.33,166,74.66,176.33,84.33,176.33);ctx.bezierCurveTo(95.66, 176.33, 94.66, 164.33, 94.66, 164.33);
}
var drawS = function(ctx) {
	ctx.moveTo(125, 173.33);ctx.lineTo(141, 163.67);ctx.bezierCurveTo(148.33, 176.33, 157, 176.33, 160, 176.33);ctx.bezierCurveTo(162.67, 176.33, 173, 176.33, 173.33, 167);ctx.bezierCurveTo(173.67, 157.67, 166, 156.67, 150, 148.67);ctx.bezierCurveTo(133.33, 141.33, 130.67, 131.67, 130.67, 120.33);ctx.bezierCurveTo(131, 109, 139.67, 95, 160, 95);ctx.bezierCurveTo(180, 95, 187.67, 111.33, 187.67, 111.33);ctx.lineTo(172.33, 121.33);ctx.bezierCurveTo(169, 114, 163.33, 112.33, 160, 112.33);ctx.bezierCurveTo(156.67, 112.67, 150, 114.33, 150, 121);ctx.bezierCurveTo(150.67, 127.67, 150.67, 127.67, 171.33, 137.33);ctx.bezierCurveTo(193, 146.67, 193.33, 158.33, 193.33, 167.33);ctx.bezierCurveTo(193.33, 175, 188.67, 193.33, 160.67, 193.33);ctx.bezierCurveTo(132.33, 193.33, 125, 173.33, 125, 173.33);ctx.fill();ctx.closePath();
}
var drawJSLogo = function(ctx) {
	drawJSBox(ctx);
	drawJ(ctx);
	drawS(ctx);
}