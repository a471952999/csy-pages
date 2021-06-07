const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()

const browserSync = require('browser-sync')
const bs = browserSync.create()

// const sass = require('gulp-sass')
// const babel = require('gulp-babel')
// const swig = require('gulp-swig')
// const imagemin = require('gulp-imagemin')
// const useref = require('gulp-useref')

const cwd = process.cwd()
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      scripts: 'assets/scripts/*.js',
      styles: 'assets/style/*.css',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}
try {
  loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (error) { }

 
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src }) // 导出到对应目录 base
    .pipe(plugins.sass({ outputStyle: 'expanded' })) // 设置转换样式格式
    .pipe(dest(config.build.temp)) // 写入
    .pipe(bs.reload({ stream: true })) // 已流推到浏览器
}
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 嵌入数据
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))

  // js css html
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))

    .pipe(dest(config.build.dist))
} 

const serve = () => {
  // 监听文件变化后重新执行编译
  watch(config.build.paths.styles, {cwd: config.build.src}, style)
  watch(config.build.paths.scripts, {cwd: config.build.src}, script)
  watch(config.build.paths.pages, {cwd: config.build.src}, series(page, useref))
  // 不需要监听  开发模式不去编译以下文件
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)

  watch([
    config.build.paths.images,
    config.build.paths.fonts
  ], {cwd: config.build.src}, bs.reload)

  watch([ '**' ], {cwd: config.build.public}, bs.reload)

  bs.init({
    notify: false, // 系统提示
    // port: 2080,
    open: false,
    // files: 'dist/**',  //监听files下面的文件,改变热更新页面
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public], // 启动访问路径  默认dist,  找不到就找src 和 public
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const compile = parallel(style, script, page)
// 发布模式
const build = series(clean, parallel(compile, extra, image, font), useref)
// 开发模式
const dev = series(compile, useref, serve)

module.exports = {
  clean,
  build,
  dev
}
