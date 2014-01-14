module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({
		lint: {
			files: [
				'../src/license.js',
				'../src/canDo.js',
				'../src/utilities.js',
				'../src/easing.js',
				'../src/getRGB.js'
			]
		},
  		concat: {
			canDo: {
				src: [
					'../src/license.js',
					'../src/canDo.js',
					'../src/utilities.js',
					'../src/easing.js',
					'../src/getRGB.js',
				],
				dest: '../canDo.js'
			}
		},
		min: {
			src: ['../canDo.js'],
			dest: '../canDo.min.js'
		},
		docco: {
			src: ["../canDo.js"],
			dest: ["../docs/"]
		}

	});
	
	grunt.loadNpmTasks('grunt-docco');
	grunt.registerTask('default', 'lint concat docco min');
};