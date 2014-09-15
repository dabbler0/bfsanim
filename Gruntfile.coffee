module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

    coffee:
      options:
        sourceMap: true
      build:
        {dest: 'index.js', src: 'index.coffee'}

    watch:
      sources:
        files: ['index.coffee']
        tasks: ['coffee']

  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.registerTask 'default', ['coffee']
