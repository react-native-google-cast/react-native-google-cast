const chokidar = require('chokidar')
const debounce = require('lodash/debounce')
const compileDocs = require('./docsCompile')

chokidar
  .watch('lib/**/*.ts', {
    interval: 100,
  })
  .on(
    'change',
    debounce((path, stats) => {
      if (!path) return

      compileDocs('--disableOutputCheck')
    }, 100)
  )
