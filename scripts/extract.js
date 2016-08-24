var Promise = require('any-promise')
var thenify = require('thenify')
var readdir = thenify(require('fs').readdir)
var writeFile = thenify(require('fs').writeFile)
var readFile = thenify(require('fs').readFile)
var join = require('path').join
var minimatch = require('minimatch')
var match = process.argv[2] || '*'

var extract = require('../').extract

var FIXTURE_DIR = join(__dirname, '../test/fixtures')

readdir(FIXTURE_DIR)
  .then(paths => {
    return Promise.all(paths.map(path => {
      var dir = join(FIXTURE_DIR, path)

      // Skip updating entities that are being ignored.
      if (!minimatch(path, match)) {
        return
      }

      return readFile(join(dir, 'result.json'), 'utf8')
        .then(contents => JSON.parse(contents))
        .then(result => extract(result))
        .then(snippet => {
          return writeFile(join(dir, 'snippet.json'), JSON.stringify(snippet, null, 2))
        })
        .then(() => {
          console.log(`Extracted "${path}"`)
        })
    }))
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
