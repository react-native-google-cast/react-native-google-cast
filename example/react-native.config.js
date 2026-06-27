const path = require('path');
const pkg = require('../package.json');

// Tell React Native autolinking where the local library lives. Required because
// the library is the workspace root and Yarn does not symlink it into
// node_modules, so use_native_modules! / Gradle autolinking can't discover it
// by the usual node_modules scan.
module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
    },
  },
};
