/*
* gulpfile.js
*/

var gulp = require('gulp');
var util = require('gulp-util');
var header = require('gulp-header')
var ghelper = require('gulp-helper');
ghelper.require();

var pkg = require('./package.json');
var using = require('./using.json');
var dependences = require('./dependencies.json');
var ip = require('ip');

var banner = [
  "/* ",
  " * <%= pkg.name %> <%= pkg.version %>",
  " * <%= pkg.description %>",
  " * MIT Licensed",
  " * ",
  " * Copyright (C) 2015 phi, http://phinajs.com",
  " */",
  "",
  "",
  "'use strict';",
  "",
  "",
].join('\n');



gulp.task('default', ['uglify']);
gulp.task('dev', ['watch', 'webserver']);

gulp.task('concat', function() {
  var scripts = [];
	var recurser = function(d) {
		d.forEach(function(f) {
	    scripts.indexOf('./phina.js/src/' + f) < 0 && scripts.push('./phina.js/src/' + f);
			dependences[f] && recurser(dependences[f]);
	  });
	}
	recurser(using.files);

  return gulp.src(scripts)
    .pipe(require('gulp-concat')('phina.js'))
    .pipe(require('gulp-replace')('<%= version %>', pkg.version))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('./phina.js/build/'));
});

gulp.task('uglify', ['concat'], function() {
  return gulp.src('./phina.js/build/phina.js')
    .pipe(require('gulp-uglify')({
      banner: '/* hoge */'
    }))
    .pipe(header(banner, {
      pkg: pkg,
    }))
    .pipe(require('gulp-rename')({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('./phina.js/build/'))
    .on('end', function() {
      util.log(util.colors.blue('finish'));
      util.beep();
    });
});

gulp.task('docs', function() {
	exec(['jsduck ./phina.js/src --output ./phina.js/docs --title "phina.js docs"'])
});

gulp.task('watch', function() {
  gulp.watch(['./src/*', './src/**/*'], ['default']);
});


gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      host: ip.address(),
      // livereload: true,
      // port: 9000,
      directoryListing: true,
      open: true,
    }));
});
