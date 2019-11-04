'use strict'
const jsdoc2md = require('jsdoc-to-markdown')
const TypeDoc = require('typedoc')
const flatten = require('lodash/flatten')
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
        API: ['getting-started/api-overview'].concat(listPages('api/classes')),
        Types: listPages('api/interfaces'),
      },
    },
    null,
    2
  )
)

rimraf.sync('website')

function listPages(dir) {
  return flatten(
    require('fs')
      .readdirSync(__dirname + `/../docs/${dir}`)
      .map(filename => {
        // remove the file extension
        const name = filename
          .split('.')
          .slice(0, -1)
          .join('.')

        const subcategories = {
          mediametadata: [
            'generic',
            'movie',
            'musictrack',
            'photo',
            'tvshow',
            'user',
          ],
        }

        if (subcategories[name]) {
          return [
            `${dir}/${name}`,
            {
              type: 'subcategory',
              label: '',
              ids: subcategories[name].map(n => `${dir}/${n}`),
            },
          ]
        } else if (Object.values(subcategories).some(s => s.includes(name))) {
          return undefined
        } else {
          return `${dir}/${name}`
        }
      })
      .filter(a => a)
  )
}
