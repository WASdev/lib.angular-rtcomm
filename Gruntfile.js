module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    meta: {
      banner: '/**\n' +
      ' * Copyright 2014 IBM Corp.\n' +
      ' *\n' +
      ' * Licensed under the Apache License, Version 2.0 (the "License");\n' +
      ' * you may not use this file except in compliance with the License.\n' +
      ' * You may obtain a copy of the License at\n' +
      ' *\n' +
      ' * http://www.apache.org/licenses/LICENSE-2.0\n' +
      ' *\n' +
      ' * Unless required by applicable law or agreed to in writing, software\n' +
      ' * distributed under the License is distributed on an "AS IS" BASIS,\n' +
      ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
      ' * See the License for the specific language governing permissions and\n' +
      ' * limitations under the License.\n' +
      ' *\n' +
      ' * <%= pkg.description %>\n' +
      ' * @version v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' * @link <%= pkg.homepage %>\n' +
      ' * @author <%= pkg.author %>\n' +
      ' */\n'
    },
    
    dirs: {
      src: 'src',
      dest: 'dist'
    },
    
    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
//        src: ['<%= dirs.src %>/*.js', '<%= dirs.src %>/**/*.js'],
        src: ['<%= dirs.src %>/js/angular-rtcomm.js', '<%= dirs.src %>/js/rtcomm-services.js', '<%= dirs.src %>/js/rtcomm-directives.js', '<%= dirs.src %>/js/rtcomm-presence.js'],
        dest: '<%= dirs.dest %>/<%= pkg.name %>.js'
      }
    },
    
    copy: {
    	main: {
    		expand: true,
    		cwd: '<%= dirs.src %>',
    		src: ['css/*.css'],
    		dest: '<%= dirs.dest %>',
    	}
    },

    cssmin: {
    	  my_target: {
    	    files: [{
    	      expand: true,
    	      cwd: '<%= dirs.src %>',
    	      src: ['css/*.css'],
    	      dest: '<%= dirs.dest %>',
    	      ext: '.min.css'
    	    }]
    	  }
    },
    
    ngAnnotate: {
        dist: {
          files: {
            '<%= dirs.dest %>/<%= pkg.name %>.js': ['<%= dirs.dest %>/<%= pkg.name %>.js']
          }
        }
      },

    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: '<%= dirs.dest %>/<%= pkg.name %>.min.js'
      }
    },

    jshint: {
      files: ['Gruntfile.js', '<%= dirs.src %>/*.js', 'test/unit/*.js'],
      options: {
        curly: false,
        browser: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        expr: true,
        node: true,
        globals: {
          exports: true,
          angular: false,
          $: false
        }
      }
    },
    
     watch: {
      dev: {
        files: ['<%= dirs.src %>/**'],
        tasks: ['build']
      },
    },
    
    ngtemplates:  {
        'angular-rtcomm-ui': {
    	    cwd:      '<%= dirs.src %>',
    	    src:      ['templates/rtcomm/**.html', '!templates/rtcomm/rtcomm-presence.html'],
    	    dest:     '<%= dirs.dest %>/<%= pkg.name %>.js',
	        options:    {
	            htmlmin:  { collapseWhitespace: true, collapseBooleanAttributes: true },
	            append: 'true'
	          }
        },
        'angular-rtcomm-presence': {
    	    cwd:      '<%= dirs.src %>',
    	    src:      'templates/rtcomm/rtcomm-presence.html',
    	    dest:     '<%= dirs.dest %>/<%= pkg.name %>.js',
	        options:    {
	            htmlmin:  { collapseWhitespace: true, collapseBooleanAttributes: true },
	            append: 'true'
	          }

    	  }
    	}
  });

  // Build task.
  grunt.registerTask('build', ['jshint', 'concat', 'ngtemplates', 'ngAnnotate', 'uglify', 'copy', 'cssmin']);

  // Default task.
  //grunt.registerTask('default', ['build', 'watch']);
  grunt.registerTask('default', ['build']);

};
