const gulp = require('gulp')
const jsonmin = require('gulp-jsonmin')
const less = require('gulp-less')
const rename = require('gulp-rename')
const plumber = require('gulp-plumber')
const eslint = require('gulp-eslint')
const gulpif = require('gulp-if')
const exec = require('child_process').exec
const htmlMinify = require('gulp-html-minify')
const gulpFilter = require('gulp-filter')
const dependents = require('gulp-dependents')
const cssnano = require('gulp-cssnano')
const del = require('del')

const excludeList = ['!node_modules/**', '!./dist/**']
const srcFile = {
  less: ['./**/*.less'],
  wxml: ['./**/*.wxml'],
  json: ['./**/*.json', '!./package.json'],
  image: ['./**/*.{png,jpg,gif,ico,svg,jpeg}'],
  js: ['./**/*.js', '!./gulpfile.js'],
  nodeModules: ['./package.json']
}

for (var item in srcFile) {
  srcFile[item] = srcFile[item].concat(excludeList)
}

const destPath = 'dist'
const isPrd = process.env.NODE_ENV === 'production'

/* 由于less里有@import选项，当index已经import所有其他less文件时，打包之后只需要复制index.less即可 */
const filterLessList = ['./*.less', './pages/**', './templates/**', './components/**', './styles/index.less']


function copyEnv() {
  var envFile = '.env.development'
  if (process.env.NODE_ENV === 'development') {
    envFile = '.env.development.js'
  } else if (process.env.NODE_ENV === 'staging') {
    envFile = '.env.staging.js'
  } else {
    envFile = '.env.production.js'
  }
  return gulp
    .src(envFile, { since: gulp.lastRun(copyEnv) })
    .pipe(plumber())
    .pipe(rename((path) => {
      path.basename = '.env'
      console.log('build files: ' + path.dirname + '\\' + path.basename + '.js')
    }))
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function compileLess() {
  return gulp
    .src(srcFile.less, { since: gulp.lastRun(compileLess) })
    .pipe(plumber())
    .pipe(dependents())
    .pipe(gulpFilter(filterLessList))
    .pipe(less()).on('error', (err) => {
      console.log('compile less error: ', err)
    })
    .pipe(gulpif(isPrd, cssnano()))
    .pipe(rename((path) => {
      path.extname = '.wxss'
      console.log('build files: ' + path.dirname + '\\' + path.basename + '.less')
    }))
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function copyWXML() {
  return gulp
    .src(srcFile.wxml, { since: gulp.lastRun(copyWXML) })
    .pipe(plumber())
    .pipe(gulpif(isPrd, htmlMinify()))
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function copyJSON() {
  return gulp
    .src(srcFile.json, { since: gulp.lastRun(copyJSON) })
    .pipe(plumber())
    .pipe(gulpif(isPrd, jsonmin()))
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function copyImage() {
  return gulp
    .src(srcFile.image, { since: gulp.lastRun(copyImage) })
    .pipe(plumber())
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function copyJS() {
  return gulp
    .src(srcFile.js, { since: gulp.lastRun(copyJS) })
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.formatEach('compact', process.stderr))
    .pipe(eslint.failOnError())
    .pipe(gulp.dest(destPath)).on('error', (err) => {
      console.log('output error: ', err)
    })
}

function runInstall() {
  if (process.argv[process.argv.length - 1] === '-i') {
    return gulp
      .src(srcFile.nodeModules, { since: gulp.lastRun(runInstall) })
      .pipe(plumber())
      .pipe(gulp.dest(destPath)).on('error', (err) => {
        console.log('output error: ', err)
      })
      .on('end', () => {
        exec('cd dist && npm install && cd ..', () => {
          console.log('run npm install ened')
        })
      })
  } else {
    return gulp.src(srcFile.nodeModules)
  }
}

gulp.task(copyEnv)
gulp.task(compileLess)
gulp.task(copyImage)
gulp.task(copyJS)
gulp.task(copyWXML)
gulp.task(copyJSON)
gulp.task(runInstall)

gulp.task('clean', done => {
  del.sync(destPath)
  done()
})

gulp.task('watch', () => {
  gulp.watch(srcFile.less, gulp.series('compileLess'))
  gulp.watch(srcFile.image, gulp.series('copyImage'))
  gulp.watch(srcFile.js, gulp.series('copyJS'))
  gulp.watch(srcFile.wxml, gulp.series('copyWXML'))
  gulp.watch(srcFile.json, gulp.series('copyJSON'))
  gulp.watch(srcFile.nodeModules, gulp.series('runInstall'))
})

gulp.task('default', gulp.series('compileLess', 'copyEnv', 'copyJS', 'copyImage', 'copyWXML', 'copyJSON', 'runInstall', 'watch'))
gulp.task('build', gulp.series('compileLess', 'copyEnv', 'copyJS', 'copyImage', 'copyWXML', 'copyJSON', 'runInstall'))
