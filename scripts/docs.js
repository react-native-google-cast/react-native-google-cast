'use strict'
const jsdoc2md = require('jsdoc-to-markdown')
const TypeDoc = require('typedoc')
const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')
const compileDocs = require('./docsCompile')

const outputDir = 'docs/api'

rimraf.sync(outputDir)
fs.mkdirSync(outputDir)

compileDocs()

fs.writeFileSync(
  path.resolve('docs-website', 'sidebars.json'),
  JSON.stringify(
    {
      docs: {
        'Getting Started': [
          'getting-started/installation',
          'getting-started/setup',
          'getting-started/usage',
          'getting-started/troubleshooting',
        ],
        Guides: listPages('guides'),
        Components: listPages('components'),
        API: listPages('api'),
      },
    },
    null,
    2
  )
)

function listPages(dir) {
  return require('fs')
    .readdirSync(__dirname + `/../docs/${dir}`)
    .map(
      filename =>
        `${dir}/${filename
          .split('.')
          .slice(0, -1)
          .join('.')}`
    )
}
