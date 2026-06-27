const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration for the monorepo example app.
 *
 * Uses react-native-builder-bob's helper to resolve the local library
 * (`react-native-google-cast`) from the repo-root source, watch it, and dedupe
 * peer dependencies (React, React Native) against the example's copies — needed
 * because Yarn does not self-symlink the root workspace into node_modules.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = getConfig(mergeConfig(getDefaultConfig(__dirname), {}), {
  root,
  pkg,
  project: __dirname,
});
