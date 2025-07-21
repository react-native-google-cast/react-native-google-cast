[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK for Android and iOS (and maybe web/Chrome in the future), providing a unified JavaScript interface.

It is written in TypeScript so types will always be up-to-date.

## Version History

| RNGC  | React Native | iOS   | Android | Status | Notes                                                                            |
| ----- | ------------ | ----- | ------- | ------ | -------------------------------------------------------------------------------- |
| 1.x   | 🤷‍♂️           | 🤷‍♂️    | 🤷‍♂️      | 🛑     | Old version implemented for Google Cast SDK v2 with manual discoverability.      |
| 3.x   | >=0.40       | 🤷‍♂️    | 🤷‍♂️      | 🛑     | Rewrite of the library for Google Cast SDK v3 with automatic session management. |
| 4.x   | >=0.60       | 10+   |         | 🐜     | Completely rewritten API, closely resembling native Android/iOS APIs.            |
| 4.9.x | >=0.76       | 15.1+ | 24+     | ✅     | Supports React Native's New Architecture in Compatibility Mode                   |
| 5.x   | >=0.76       | 15.1+ | 24+     | 🏗️     | Currently in development with full support for React Native's New Architecture   |

## Documentation

https://react-native-google-cast.github.io/docs/getting-started/installation

## Cast Videos Demo App

<strike>Refer to the [example](example/) folder to find a React Native version of the CastVideos reference app.</strike> Currently outdated.

## Playground

Refer to the [playground](playground/) folder to find a sample app demonstrating the available APIs provided by the library.

## Expo

This library can by used by custom built Expo apps (not Expo Go) since Expo SDK 42. The config plugin is now included in this project. Follow [Installation](https://react-native-google-cast.github.io/docs/getting-started/installation#expo) and [Setup](https://react-native-google-cast.github.io/docs/getting-started/setup#expo) sections of the docs.

## Troubleshooting

See [Troubleshooting](https://react-native-google-cast.github.io/docs/getting-started/troubleshooting) in the docs.

## Contribution

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repo
3. Implement your shiny new thing
4. Demonstrate how to use it in the [playground project](playground/)
5. Document the functionality in JSDoc and the [docs](docs/)
6. Create a pull request
