module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: "/* <%= pkg.title %> v<%= pkg.version %> - https://github.com/Leimi/awesomenauts-build-maker\n" +
			"* Copyright (c) <%= grunt.template.today('yyyy') %> Emmanuel Pelletier\n" +
			"* This Source Code Form is subject to the terms of the Mozilla Public License, v2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */"
		},
		concat: {
			lib: {
				src: [
					'js/lib/jquery.min.js',
					'js/lib/underscore.js',
					'js/lib/backbone.js',
					'js/lib/backbone.localStorage.js',
					'js/lib/tabletop.js',
					'js/lib/mousetooltip.js',
					'js/lib/fastclick.js',
					'js/lib/jquery.sortable.js'
				],
				dest: 'dist/libs.js'
			},
			app: {
				options: {
					banner: "<%= meta.banner %>"
				},
				src: [
					'js/nautsbuilder/utils.js',
					'js/nautsbuilder/data/character.js',
					'js/nautsbuilder/data/skill.js',
					'js/nautsbuilder/data/upgrade.js',
					'js/nautsbuilder/data/step.js',
					'js/nautsbuilder/data/favorite.js',
					'js/nautsbuilder/views/characters.js',
					'js/nautsbuilder/views/character.js',
					'js/nautsbuilder/views/character-build.js',
					'js/nautsbuilder/views/character-order.js',
					'js/nautsbuilder/views/character-info.js',
					'js/nautsbuilder/views/skill.js',
					'js/nautsbuilder/views/upgrade.js',
					'js/nautsbuilder/views/favorites.js',
					'js/nautsbuilder/app.js',
					'js/main.js',
					'js/nautsbuilder/spreadsheet/update.js'
				],
				dest: 'dist/scripts.js'
			}
		},
		uglify: {
			libs: {
				files: {
					'dist/libs.min.js': ['dist/libs.js']
				}
			},
			app: {
				options: {
					banner: "<%= meta.banner %>"
				},
				files: {
					'dist/scripts.min.js': 'dist/scripts.js'
				}
			}
		},
		cssmin: {
			dist: {
				files: {
					'dist/styles.min.css': ['css/style.css']
				}
			}
		}
	});
	grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);
};
