## Cast Playground

Playground project that demonstrates all possible APIs of the react-native-google-cast library.

The goal is to be able to explore the library's features, as well as provide an app for automatic tests.

In addition, this playground project demonstrates how to set up and use react-native-google-cast with:

- [react-navigation](https://reactnavigation.org/)

### Setup

Make sure you're in the **playground** folder:

- Run `yarn` (or `npm i`) to install dependencies
- Run `yarn start` (or `npm run start`) to start Metro Bundler

#### iOS

- `cd ios && pod install`
- `open ios/RNGCPlayground.xcworkspace` and Run from Xcode

#### Android

- in Android Studio open `android/` folder and run from there

### Custom Receiver

The playground app works with a custom receiver. Normally, that receiver is served from https://react-native-google-cast-playground-receiver.netlify.app.

However, if you need to make changes to the receiver and test it locally, you can temporarily use your own receiver:

- create a new custom app in [Cast Publish](https://cast.google.com/publish)
- `npm i -g serve`
- `serve -l PORT -s receiver`
- set the app id in `ios/RNGCPlayground/AppDelegate.m` (iOS) and `android/app/src/main/AndroidManifest.xml` (Android)
- you can debug the receiver in Chrome by navigating to <chrome://inspect>
