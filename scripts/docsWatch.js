const fs = require('fs')
const compileDocs = require('./docsCompile')

let fsWait = null
fs.watch('lib/api', (event, filename) => {
  if (filename) {
    if (fsWait) return
    fsWait = setTimeout(() => {
      compileDocs('--disableOutputCheck')
      fsWait = null
    }, 100)
  }
})
