## CastVideos-rn

Reference React Native application shows how to cast videos from a device that is fully compliant with the Cast Design Checklist.

The aim of this app is to be analogous to the [CastVideos sample apps](https://developers.google.com/cast/docs/downloads).

Please note that this project uses `package.json` from the parent folder to simplify developing the library while testing it on this example project. If you use `react-native-google-cast` in your own project, please follow instructions in the main [README](../README.md), and understand that the location of your `package.json` will be different than in this example project.

In addition, this example project demonstrates how to set up and use react-native-google-cast with:

- [react-native-navigation](https://wix.github.io/react-native-navigation)
- [react-native-video](https://github.com/react-native-community/react-native-video)

### Setup

From the **root** of `react-native-google-cast`:

- Run `yarn` (or `npm i`) to install dependencies
- Run `yarn start` (or `npm run start`) to start Metro Bundler

#### iOS

- `cd example/ios && pod install`
- `open example/ios/CastVideos.xcworkspace` and Run from Xcode

#### Android

- run `npx jetify` to ensure dependencies are updated to AndroidX
- in Android Studio open `example/android/` folder and run from there
