var nautsbuilder = {
	"name": "Nautsbuilder - Awesomenauts build calculator",
	"version": "0.1"
};

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-mincss');

	grunt.initConfig({
		pkg: nautsbuilder,
		meta: {
			banner: "/* <%= pkg.name %> v<%= pkg.version %> - https://github.com/Leimi/awesomenauts-build-maker\n" +
			"* Copyright (c) <%= grunt.template.today('yyyy') %> Emmanuel Pelletier\n" +
			'* Licensed GPL v2 http://www.opensource.org/licenses/gpl-2.0.php */'
		},
		concat: {
			dist: {
				src: [
					'js/lib/jquery.min.js',
					'js/lib/underscore.js',
					'js/lib/backbone.js',
					'js/lib/tabletop.js',
					'js/lib/mousetooltip.js',
					'<banner>',
					'js/nautsbuilder/utils.js',
					'js/nautsbuilder/data/character.js',
					'js/nautsbuilder/data/skill.js',
					'js/nautsbuilder/data/upgrade.js',
					'js/nautsbuilder/data/step.js',
					'js/nautsbuilder/views/characters.js',
					'js/nautsbuilder/views/character.js',
					'js/nautsbuilder/views/character-build.js',
					'js/nautsbuilder/views/character-order.js',
					'js/nautsbuilder/views/character-stats.js',
					'js/nautsbuilder/views/skill.js',
					'js/nautsbuilder/views/upgrade.js',
					'js/nautsbuilder/app.js',
					'js/main.js'
				],
				dest: 'dist/scripts.js'
			}
		},
		min: {
			dist: {
				src: ['<banner>', 'dist/scripts.js'],
				dest: 'dist/scripts.min.js'
			}
		},
		mincss: {
			dist: {
				files: {
					'dist/styles.min.css': ['css/style.css']
				}
			}
		}
	});
	grunt.registerTask('default', 'concat min mincss');
};