const execSync = require('child_process').execSync

module.exports = function compileDocs(args = '') {
  execSync(
    `./node_modules/.bin/typedoc --out docs/api --theme markdown --mdDocusaurus --mdHideSources --readme none --mode file ${args} lib/api`
  )
}
