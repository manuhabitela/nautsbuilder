module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: "/* <%= pkg.title %> v<%= pkg.version %> - https://github.com/Leimi/nautsbuilder\n" +
			"* Copyright (c) <%= grunt.template.today('yyyy') %> Emmanuel Pelletier\n" +
			"* This Source Code Form is subject to the terms of the Mozilla Public License, v2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */"
		},

		compass: {
			dist: {}
		},

		jshint: {
			files: ['Gruntfile.js', 'js/main.js', 'js/nautsbuilder/**/*.js'],
			options: {
				globals: {
					jQuery: true
				}
			}
		},

		csslint: {
			lax: {
				options: {
					"box-sizing": false, // affects IE6,7
					"adjoining-classes": false, // affect IE6
					"fallback-colors": false // affects IE6,7,8
				},
				formatters: ["text"],
				src: ['css/style.css']
			}
		},

		scsslint: {
			allFiles: ['scss/**/*.scss'],
			options: {
				colorizeOutput: true,
				compact: true,
				force: true
			}
		},

		concat: {
			libs: {
				src: [
					'js/lib/jquery.min.js',
					'js/lib/underscore.js',
					'js/lib/backbone.js',
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
					'js/nautsbuilder/data/effectvalue.js',
					'js/nautsbuilder/data/effect.js',
					'js/nautsbuilder/data/character.js',
					'js/nautsbuilder/data/skill.js',
					'js/nautsbuilder/data/upgrade.js',
					'js/nautsbuilder/data/step.js',
					'js/nautsbuilder/views/characters.js',
					'js/nautsbuilder/views/character.js',
					'js/nautsbuilder/views/character-build.js',
					'js/nautsbuilder/views/character-order.js',
					'js/nautsbuilder/views/character-info.js',
					'js/nautsbuilder/views/skill.js',
					'js/nautsbuilder/views/upgrade.js',
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
					'dist/libs.min.js': ['<%= concat.libs.dest %>']
				}
			},
			app: {
				options: {
					banner: "<%= meta.banner %>"
				},
				files: {
					'dist/scripts.min.js': ['<%= concat.app.dest %>']
				}
			}
		},

		cssmin: {
			dist: {
				files: {
					'dist/styles.min.css': ['css/style.css']
				}
			}
		},

		replace: {
			indexProdTrue: {
				src: ['index.php'],
				dest: 'index-dist.php',
				replacements: [{
					from: /^(\s*define\('PROD'.*)$/gm,
					to: '//$1'
				},{
					from: /^(\s*)\/\/\s*(define\('PROD',\s*true\);)$/gm,
					to: '$1$2'
				}]
			},
		},

		php: {
			test: {
				options: {
					hostname: 'localhost',
					port: 8080,
					keepalive: true,
					open: true,
					silent: true
				}
			},

			testdist: {
				options: {
					hostname: 'localhost',
					port: 8080,
					keepalive: true,
					open: '<%= replace.indexProdTrue.dest %>',
					silent: true
				}
			}
		},

		clean: {
			build: ["css/"],
			dist: ["dist/", "index-dist.php"],
			data: ["data/*.json", "data/last-update.js", "js/nautsbuilder/spreadsheet/last-update.js"]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-compass');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-scss-lint');

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-php');

	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('build', ['compass']);
	grunt.registerTask('dist', ['build', 'concat', 'uglify', 'cssmin']);

	grunt.registerTask('lint', ['build', 'csslint', 'scsslint', 'jshint']);
	grunt.registerTask('test', ['build', 'php:test']);
	grunt.registerTask('testdist', ['dist', 'replace:indexProdTrue', 'php:testdist']);

	grunt.registerTask('default', ['dist']);
};
