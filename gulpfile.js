"use strict";
// gulp
let gulp = require('gulp');

// plugins
let jshint = require('gulp-jshint');
let sass = require('gulp-sass');
let concat = require('gulp-concat');
let uglify = require('gulp-uglify');
let rename = require('gulp-rename');
let livereload = require('gulp-livereload');

// Javscript linter
gulp.task('lint', function() {
    return gulp.src('js/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(livereload());
});

// Styles processing
gulp.task('sass', function() {
    return gulp.src('scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('css'))
        .pipe(livereload());
});

// Javascript processing
gulp.task('scripts', function() {
    return gulp.src('js/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('js'))
        .pipe(livereload());
});

// Watching for changes
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch('js/**/*.js', ['lint', 'scripts']);
    gulp.watch('scss/**/*.scss', ['sass']);
});

// Default task
gulp.task('default', ['lint', 'sass', 'scripts', 'watch']);