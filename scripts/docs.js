'use strict'
const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')

/* input and output paths */
const inputFile = 'lib/api/*.js'
const outputDir = 'docs/api'

/* get template data */
const templateData = jsdoc2md.getTemplateDataSync({ files: inputFile })

/* reduce templateData to an array of class names */
templateData
  .filter(item => ['class', 'typedef'].includes(item.kind))
  .forEach(item => {
    if (item.memberof) return
    const helper = item.kind === 'class' ? 'class' : 'identifier'
    const template = `---
id: ${item.name}
title: ${item.name}
sidebar_label: ${item.name}
---

{{#${helper} name="${item.name}"}}{{>docs}}{{/${helper}}}`

    const output = jsdoc2md.renderSync({
      data: templateData,
      template: template,
    })
    fs.writeFileSync(path.resolve(outputDir, `${item.name}.md`), output)
  })

fs.writeFileSync(
  path.resolve('docs-website', 'sidebars.json'),
  JSON.stringify(
    {
      docs: {
        'Getting Started': listPages('getting-started'),
        Guides: listPages('guides'),
        Components: listPages('components'),
        API: listPages('api'),
      },
    },
    null,
    2,
  ),
)

function listPages(dir) {
  return require('fs')
    .readdirSync(__dirname + `/../docs/${dir}`)
    .map(
      filename =>
        `${dir}/${filename
          .split('.')
          .slice(0, -1)
          .join('.')}`,
    )
}
