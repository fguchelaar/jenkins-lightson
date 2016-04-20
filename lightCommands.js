function LightCommands() {
	
}

LightCommands.prototype.on = function() {
	return [0xCC,0x23,0x33]; // [-52, 35, 51]
};

LightCommands.prototype.off = function() {
	return [0xCC,0x24,0x33]; // [-52, 36, 51]
};

// Static color mode:
//
//  0x56,  0x10,  0x00,  0x00,  0x00,  0xF0,  0xAA
//    |      |      |      |      |      |      |
// constant  |    green    |   constant  |   constant
//          red          blue        constant
LightCommands.prototype.rgb = function(r, g, b) {
	return [0x56, r, g, b, 0x00, 0xF0, 0xAA];
};

// Built-in function mode:
//
//  0xBB,  0x28,  0x0A,  0x44
//    |      |      |      |
// constant  |    speed    |
//          mode        constant
LightCommands.prototype.builtInFunction = function(mode, speed) {
	return [0xBB, mode, speed, 0x44];
};

module.exports = LightCommands;