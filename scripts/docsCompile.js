module.exports = function compileDocs(args = '') {
  require('child_process').execSync(
    `./node_modules/.bin/typedoc --options typedoc.json --out docs/api ${args} src/api src/types`,
    { stdio: 'inherit' }
  )
}
