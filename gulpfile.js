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
const cached = require('gulp-cached')
const debug = require('gulp-debug')
const copy = require('@cloudcmd/copy-file')
const Stream = require('stream')

const excludeList = ['!node_modules/**', '!./dist/**']
const srcFile = {
  less: ['./**/*.less'],
  wxml: ['./**/*.wxml'],
  json: ['./**/*.json', '!./package.json'],
  image: ['./**/*.{png,jpg,gif,ico,svg,jpeg}'],
  js: ['./**/*.js', '!./gulpfile.js'],
  nodeModules: ['./package.json'],
}

for (var item in srcFile) {
  srcFile[item] = srcFile[item].concat(excludeList)
}

const destPath = 'dist'
const isPrd = process.env.NODE_ENV === 'production'

/* 由于less里有@import选项，当index已经import所有其他less文件时，打包之后只需要复制index.less即可 */
const filterLessList = [
  './*.less',
  './pages/**',
  './templates/**',
  './components/**',
  './styles/index.less',
]

function registerWatch(watcher, cb) {
  watcher.on('unlink', (file) => {
    file = file.replace(/\\/g, '/')
    if (file.includes('.less')) {
      del.sync(destPath + '/' + file.replace(/.less/g, '.wxss'))
    } else {
      del.sync(destPath + '/' + file)
    }
    console.log('removed file: ' + file)
  })
  watcher.on('add', (file) => {
    if (file.includes('.less')) {
      typeof cb === 'function' && cb()
    } else {
      copy(file, destPath + '/' + file.replace(/\\/g, '/'))
    }
    console.log('added file: ' + file)
  })
  watcher.on('change', () => {
    typeof cb === 'function' && cb()
  })
}

gulp.task('copyEnv', (done) => {
  var envFile = '.env.development'
  if (process.env.NODE_ENV === 'development') {
    envFile = '.env.development.js'
  } else if (process.env.NODE_ENV === 'staging') {
    envFile = '.env.staging.js'
  } else {
    envFile = '.env.production.js'
  }
  return gulp
    .src(envFile)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(
      rename((path) => {
        path.basename = '.env'
        console.log(
          'build files: ' + path.dirname + '\\' + path.basename + '.js'
        )
      })
    )
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('compileLess', (done) => {
  return gulp
    .src(srcFile.less)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(dependents())
    .pipe(gulpFilter(filterLessList))
    .pipe(less())
    .on('error', (err) => {
      console.log('compile less error: ', err)
    })
    .pipe(gulpif(isPrd, cssnano()))
    .pipe(
      rename((path) => {
        path.extname = '.wxss'
        console.log(
          'build files: ' + path.dirname + '\\' + path.basename + '.less'
        )
      })
    )
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('copyWXML', (done) => {
  return gulp
    .src(srcFile.wxml)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(gulpif(isPrd, htmlMinify()))
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('copyJSON', (done) => {
  return gulp
    .src(srcFile.json)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(gulpif(isPrd, jsonmin()))
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('copyImage', (done) => {
  return gulp
    .src(srcFile.image)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('copyJS', (done) => {
  return gulp
    .src(srcFile.js)
    .pipe(cached('caching'))
    .pipe(debug({ title: 'cached' }))
    .pipe(plumber())
    .pipe(eslint())
    .pipe(
      eslint.result((result) => {
        console.log(
          `esLint: ${result.filePath} - errors: (${result.errorCount})`
        )
      })
    )
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      console.log('output error: ', err)
    })
    .on('end', () => {
      done()
    })
})

gulp.task('runInstall', (done) => {
  if (process.argv[process.argv.length - 1] === '-i') {
    return gulp
      .src(srcFile.nodeModules)
      .pipe(cached('caching'))
      .pipe(debug({ title: 'cached' }))
      .pipe(plumber())
      .pipe(gulp.dest(destPath))
      .on('error', (err) => {
        console.log('output error: ', err)
      })
      .pipe(
        (function () {
          var stream = new Stream.Transform({ objectMode: true })
          stream._transform = () => {
            exec('cd dist && npm install && cd ..', () => {
              done()
            })
          }

          return stream
        })()
      )
  } else {
    done()
  }
})

gulp.task('clean', (done) => {
  del.sync([destPath + '/**/**', destPath + '/**/.env.js'])
  done()
})

gulp.task('watch', () => {
  const watchList = [
    {
      stream: gulp.watch(srcFile.less),
      cb: gulp.series('compileLess'),
    },
    {
      stream: gulp.watch(srcFile.image),
      cb: gulp.series('copyImage'),
    },
    {
      stream: gulp.watch(srcFile.js),
      cb: gulp.series('copyJS'),
    },
    {
      stream: gulp.watch(srcFile.wxml),
      cb: gulp.series('copyWXML'),
    },
    {
      stream: gulp.watch(srcFile.json),
      cb: gulp.series('copyJSON'),
    },
  ]
  watchList.forEach((item) => {
    registerWatch(item.stream, item.cb)
  })
})

gulp.task(
  'default',
  gulp.series(
    'compileLess',
    'copyEnv',
    'copyJS',
    'copyImage',
    'copyWXML',
    'copyJSON',
    'runInstall',
    'watch'
  )
)
gulp.task(
  'build',
  gulp.series(
    'compileLess',
    'copyEnv',
    'copyJS',
    'copyImage',
    'copyWXML',
    'copyJSON',
    'runInstall'
  )
)
