const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')
const escape = require('escape-string-regexp')
const pak = require('../package.json')

const root = path.resolve(__dirname, '..')

const modules = Object.keys({
  ...pak.peerDependencies,
})

// Add your local library to extraNodeModules
const localLibs = {
  'react-native-google-cast': path.resolve(__dirname, '..'),
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [root],

  resolver: {
    blockList: modules.map(
      (m) => new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
    ),

    extraNodeModules: {
      ...modules.reduce((acc, name) => {
        acc[name] = path.join(__dirname, 'node_modules', name)
        return acc
      }, {}),
      ...localLibs,
    },
  },

  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
