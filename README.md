[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK for Android and iOS (and maybe web/Chrome in the future), providing a unified JavaScript interface.

It is written in TypeScript so types will always be up-to-date.

## Version overview

| RNGC | React Native | Purpose                                                                                                                                               |
| ---- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.x  | 🤷‍♂️           | Old version implemented for Google Cast SDK v2 with manual discoverability. Not maintained anymore.                                                   |
| 3.x  | >=0.40       | Rewrite of the library for Google Cast SDK v3 with automatic session management. Only bug fixes will be merged.                                       |
| 4.x  | >=0.60       | Current version with a completely rewritten API, closely resembling native Android/iOS(/Chrome?) APIs. We highly recommend to use the latest version. |

## Documentation

https://react-native-google-cast.github.io/docs/getting-started/installation

## Example

Refer to the [example](example/) folder to find a React Native version of the CastVideos reference app.

## Playground

Refer to the [playground](playground/) folder to find a sample app demonstrating the available APIs provided by the library.

## Troubleshooting

See [Troubleshooting](https://react-native-google-cast.github.io/docs/getting-started/troubleshooting) in the docs.

## Contribution

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repo
3. Implement your shiny new thing
4. Demonstrate how to use it in the [playground project](playground/)
5. Document the functionality in JSDoc and the [docs](docs/)
6. Create a pull request
