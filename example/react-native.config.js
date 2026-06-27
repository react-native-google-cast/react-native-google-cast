const path = require('path');
const pkg = require('../package.json');

// The library is the workspace root and isn't symlinked into node_modules, so
// RN autolinking can't auto-detect it. Point it at the root and give explicit
// platform sources so both iOS and Android are linked.
const root = path.join(__dirname, '..');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root,
      platforms: {
        ios: {
          podspecPath: path.join(root, 'NitroGoogleCast.podspec'),
        },
        android: {
          sourceDir: path.join(root, 'android'),
        },
      },
    },
  },
};
