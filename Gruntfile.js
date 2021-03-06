module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                // banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                sourceMap: 'build/hue.map.js',
                sourceMappingURL: 'hue.map.js',
                sourceMapRoot: '../',
            },
            build: {
                src: 'src/hue.js',
                dest: 'build/hue.min.js'
            }
        },

        jshint: {
            options: {
                curly: false,
                eqeqeq: true,
                eqnull: true
            },
            all: {
                options: {
                    "-W064": true
                },
                src: ['src/**/*.js']
            }
        },

        watch: {
            options: {
                livereload: true,
            },
            src: {
                files: ['src/*.js', 'test/**/*.js'],
                tasks: ['lint'],
            }
        },
    });

    // Load tasks from plugins.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('lint', ['jshint:all']);
    grunt.registerTask('default', ['jshint:all', 'uglify']);

};