module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({
		
		min: {
			default: {
				src: ['../canDo.js'],
				dest: '../canDo.min.js'
			}
		},
		
		docco: {
			src: ["../canDo.js"],
			dest: ["../docs/"]
		}

	});
	
	grunt.loadNpmTasks('grunt-docco');
	grunt.registerTask('default', 'docco min');
};