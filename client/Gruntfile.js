
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*! \n* <%= pkg.title || pkg.name %> - v<%= pkg.version %>' +
            '\n* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %> ' +
            '\n* <%= pkg.homepage ? pkg.homepage : "" %> ' +
            '\n*/ \n\n',

    paths: {
      app: {
        root: "app/"
      },
      vendor: {
        js: "vendor/scripts/",
        fonts: "vendor/fonts/",
        css: "vendor/styles/"
      },
      dist: {
        root: "dist/",
        appName: "hackdashApp.js",
        embedName: "embedApp.js",
        vendorName: "vendor.js",
        vendorCSSName: "vendor.css",
        exportJS: "../public/js/",
        exportCSS: "../public/styles/",
        exportFonts: "../public/fonts/"
      }
    },

    clean: {
      before: {
        src: [
          "<%= paths.dist.root %>*",
          "!<%= paths.dist.root %>.gitignore"
        ],
      }
    },

    browserify: {
      app: {
        options:{
          banner: '<%= banner %>',
          extension: [ '.js', '.hbs' ],
          transform: [ 'hbsfy' ],
          //debug: true
        },
        src: ['<%= paths.app.root %>index.js'],
        dest: '<%= paths.dist.root %><%= paths.dist.appName %>'
      },
      embed: {
        options:{
          banner: '<%= banner %>',
          extension: [ '.js', '.hbs' ],
          transform: [ 'hbsfy' ],
          //debug: true
        },
        src: ['<%= paths.app.root %>indexEmbed.js'],
        dest: '<%= paths.dist.root %><%= paths.dist.embedName %>'
      }
    },

    concat: {
      styles: {
        src: [
            '<%= paths.vendor.css %>bootstrap.min.css'
          , '<%= paths.vendor.css %>bootstrap-responsive.min.css'
          , '<%= paths.vendor.css %>**/*.css'
         ],
        dest: '<%= paths.dist.root %><%= paths.dist.vendorCSSName %>'
      },
      vendor: {
        options: {
          separator: ';\n',
        },
        src: [
            '<%= paths.vendor.js %>underscore.min.js'
          , '<%= paths.vendor.js %>backbone.min.js'
          , '<%= paths.vendor.js %>backbone.marionette.min.js'
          , '<%= paths.vendor.js %>bootstrap.min.js'
          , '<%= paths.vendor.js %>**/*.js'
         ],
        dest: '<%= paths.dist.root %><%= paths.dist.vendorName %>'
      }
    },

    copy: {
      dist: {
        cwd: "./",
        files: [{

          "<%= paths.dist.exportCSS %><%= paths.dist.vendorCSSName %>":
            "<%= paths.dist.root %><%= paths.dist.vendorCSSName %>",

          "<%= paths.dist.exportJS %><%= paths.dist.vendorName %>":
            "<%= paths.dist.root %><%= paths.dist.vendorName %>",

          "<%= paths.dist.exportJS %><%= paths.dist.appName %>":
            "<%= paths.dist.root %><%= paths.dist.appName %>",

          "<%= paths.dist.exportJS %><%= paths.dist.embedName %>":
            "<%= paths.dist.root %><%= paths.dist.embedName %>"
        },
        {
            expand:true,
            dest: "<%= paths.dist.exportFonts %>",
            cwd: "<%= paths.vendor.fonts %>",
            src: '*.*'
        },
        ]
      }

    },

    watch: {
      local: {
        files: ["<%= paths.app.root %>**/*"],
        tasks: ['default'],
        options: {
          atBegin: true
        }
      }
    },

    jshint: {
      all: {
        files: {
          src: ["<%= paths.app.root %>**/*.js"]
        },
        options: {
          bitwise: true
          ,curly: true
          ,eqeqeq: true
          ,forin: true
          ,immed: true
          ,latedef: true
          ,newcap: true
          ,noempty: true
          ,nonew: true
          ,quotmark: false
          ,undef: true
          ,unused: true
          ,laxcomma: true

          ,globals: {
            window: true
            ,jQuery: true
            ,$: true
            ,_: true
            ,require: true
            ,module: true
            ,Backbone: true
            ,Handlebars: true
            ,console: true
            ,moment: true
            ,markdown: true
            ,Placeholders: true
            ,Packery: true
            ,Draggabilly: true
            ,Dropzone: true
            ,hackdash: true
          }
        }
      }
    },

    notify_hooks: {
      options: {
        enabled: true,
        max_jshint_notifications: 2, // maximum number of notifications from jshint output
        // title: "Project Name", // defaults to the name in package.json, or will use project directory's name
        success: true, // whether successful grunt executions should be notified automatically
        duration: 1 // the duration of notification in seconds, for `notify-send only
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-notify');

  grunt.task.run('notify_hooks');

  grunt.registerTask("default", [
    "clean:before",
    "jshint:all",
    "browserify",
    "concat",
    "copy"
  ]);

};
