## react-native-google-cast playground

Playground demonstrating the full functionality of the `react-native-google-cast` library. The main purpose of the playground is to provide an app for e2e tests but you can also browse it manually.

Please note that this project uses `package.json` from the parent folder to simplify developing the library while testing it on this example project. If you use `react-native-google-cast` in your own project, please follow instructions in the main [README](../README.md), and understand that the project structure will be slightly different than in this example project.

In addition, this example project demonstrates how to set up and use react-native-google-cast with:

- [react-navigation](https://reactnavigation.org)

### Setup

From the **root** of `react-native-google-cast`:

- Run `yarn` (or `npm i`) to install dependencies
- Run `yarn start` (or `npm run start`) to start Metro Bundler

#### iOS

- `cd playground/ios && pod install`
- `open playground/ios/RNGCPlayground.xcworkspace` and Run from Xcode

#### Android

- run `npx jetify` to ensure dependencies are updated to AndroidX
- in Android Studio open `playground/android/` folder and run from there
