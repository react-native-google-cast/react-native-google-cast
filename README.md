[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK for Android and iOS (and maybe web/Chrome in the future), providing a unified JavaScript interface.

It is written in TypeScript so types will always be up-to-date.

## Version History

| RNGC | React Native | iOS | Android | Maintained | Notes                                                                            |
| ---- | ------------ | --- | ------- | ---------- | -------------------------------------------------------------------------------- |
| 1.x  | 🤷‍♂️           | 🤷‍♂️  | 🤷‍♂️      | 🛑         | Old version implemented for Google Cast SDK v2 with manual discoverability.      |
| 3.x  | >=0.40       | 🤷‍♂️  | 🤷‍♂️      | 🛑         | Rewrite of the library for Google Cast SDK v3 with automatic session management. |
| 4.x  | >=0.60       | 10+ |         | 🐜         | Completely rewritten API, closely resembling native Android/iOS APIs.            |
| 5.x  | >=0.68       | 13+ |         | ✅         | Rewritten using React Native's New Architecture                                  |

> Version 5.x is currently in development.

## Documentation

https://react-native-google-cast.github.io/docs/getting-started/installation

## Example

Refer to the [example](example/) folder to find a React Native version of the CastVideos reference app.

## Playground

Refer to the [playground](playground/) folder to find a sample app demonstrating the available APIs provided by the library.

## Expo

This library can by used by custom built Expo apps since Expo SDK 42. See [@config-plugins/react-native-google-cast](https://github.com/expo/config-plugins/tree/master/packages/react-native-google-cast) for more information.

## Troubleshooting

See [Troubleshooting](https://react-native-google-cast.github.io/docs/getting-started/troubleshooting) in the docs.

## Contribution

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repo
3. Implement your shiny new thing
4. Demonstrate how to use it in the [playground project](playground/)
5. Document the functionality in JSDoc and the [docs](docs/)
6. Create a pull request
