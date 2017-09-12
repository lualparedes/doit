// gulp
var gulp = require('gulp');

// plugins
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var gutil = require('gulp-util');

// Styles processing
gulp.task('styles', function() {
    return gulp.src('scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('css'));
});

// Watching for changes
gulp.task('watch', function() {
    gulp.watch('js/**/*.js');
    gulp.watch('scss/**/*.scss', ['styles']);
});

// Default task
gulp.task('default', [
    'styles', 
    'watch'
]);