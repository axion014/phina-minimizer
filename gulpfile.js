/*
* gulpfile.js
*/

var fs = require("fs");

var gulp = require('gulp');
var util = require('gulp-util');
var header = require('gulp-header')
var ghelper = require('gulp-helper');
ghelper.require();

var ppkg = require('./phina.js/package.json');
var pkg = require('./package.json');
var dependences = require('./dependencies.json');
var ip = require('ip');

var pbanner = [
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

var banner = [
  "/*",
  " * <%= pkg.name %> <%= pkg.version %> used ",
  " *",
	""
].join('\n');

var showall = false;

gulp.task('showall', ['ishowall', 'default']);
gulp.task('ishowall', function() {showall = true;});
gulp.task('default', ['uglify']);
gulp.task('dev', ['watch', 'webserver']);

gulp.task('concat', function() {
  var scripts = [];
	var recurser = function(d, n) {
		d.forEach(function(f) {
			if (scripts.indexOf('./phina.js/src/' + f) < 0 && showall) {
				util.log(util.colors.cyan(' '.repeat(n) + f))
			} else if (scripts.indexOf('./phina.js/src/' + f) < 0 || showall) util.log(' '.repeat(n) + f);
			dependences[f] && recurser(dependences[f], n + 1);
	    scripts.indexOf('./phina.js/src/' + f) < 0 && scripts.push('./phina.js/src/' + f);
	  });
	}
	recurser(fs.readFileSync('./using.txt').toString().split('\n').map(v => v.substring(0, v.indexOf('//') < 0 ? v.length : v.indexOf('//')))
		.map(v => v.replace(/ +$/, '')).filter(v => !!v).map(v => v.replace('.', '/')).map(v => v + '.js'), 0);

  return gulp.src(scripts)
    .pipe(require('gulp-concat')('phina.core.js'))
    .pipe(require('gulp-replace')('<%= version %>', pkg.version))
		.pipe(header(pbanner, {pkg: ppkg}))
		.pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('./phina.js/build/'));
});

gulp.task('uglify', ['concat'], function() {
  return gulp.src('./phina.js/build/phina.core.js')
    .pipe(require('gulp-uglify')({banner: '/* hoge */'}))
		.pipe(header(pbanner, {pkg: ppkg}))
		.pipe(header(banner, {pkg: pkg}))
    .pipe(require('gulp-rename')({extname: '.min.js'}))
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
