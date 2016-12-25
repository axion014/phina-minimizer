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
var dependencies = require('./dependencies.json');
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
	var notFounds = []
	var recurser = function(d, n) {
		d.forEach(function(f) {
			var erase = f.startsWith('-');
			var isdependensed = dependencies[f] && !f.endsWith('(-d)') && !erase;
			f = f.replace(/\(-d\)$/, '').replace(/^-/, '');
			var exists = fs.statSync('./phina.js/src/' + f).isFile();
			if (((scripts.indexOf('./phina.js/src/' + f) < 0 && erase) || (!erase && !exists)) && !notFounds.indexOf(f) < 0) {
				notFounds.push(f);
				util.log(util.colors.red(' '.repeat(n) + f + ' not found'));
			} else if (scripts.indexOf('./phina.js/src/' + f) < 0 && showall) util.log(util.colors.cyan(' '.repeat(n) + f));
			else if (scripts.indexOf('./phina.js/src/' + f) < 0 || showall) util.log(' '.repeat(n) + f);
			isdependensed && exists && recurser(dependencies[f], n + 1);
	    erase ? (() => {
				util.log(util.colors.red('-' + f));
		    var index  = scripts.indexOf('./phina.js/src/' + f);
		    if (index >= 0) scripts.splice(index, 1);
		  })() : scripts.indexOf('./phina.js/src/' + f) < 0 && exists && scripts.push('./phina.js/src/' + f);
	  });
	}
	var flat = function (previousValue, currentValue) {
		return Array.isArray(currentValue) ? previousValue.concat(currentValue.reduce(flat, [])) : previousValue.concat(currentValue);
	}
	recurser(fs.readFileSync('./using.txt').toString().split('\n').map(v => v.substring(0, v.includes('//') ? v.indexOf('//') : v.length))
		.map(v => v.replace(/ +$/, '')).filter(v => !!v).map(v => v.replace('.', '/')).map(v => v + '.js').map(v => v.includes('*') ? (() => {
			var arr = [];
			fs.readdirSync('./phina.js/src/' + v.replace('*.js', '')).filter(function(file){
				return fs.statSync('./phina.js/src/' + v.replace('*.js', '') + file).isFile(); //絞り込み
			}).forEach(function (file) {arr.push(v.replace('*.js', file));});
			return arr;
		})() : v).reduce(flat, []), 0);

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
