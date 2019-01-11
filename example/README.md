## react-native-google-cast example project

Example project demonstrating the functionality of the `react-native-google-cast` library.

Please note that this project uses `package.json` from the parent folder to simplify developing the library while testing it on this example project. If you use `react-native-google-cast` in your own project, please follow instructions in the main [README](../README.md), and understand that the project structure will be slightly different than in this example project.

### Setup

- Run `yarn` (or `npm i`) from the root of `react-native-google-cast`

iOS

- `cd example/ios && pod install`
- `open example/ios/RNGoogleCastExample.xcworkspace` and Run from Xcode

Android

- in Android Studio open `example/android/` folder and run from there

## Troubleshooting

- `com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.`

  You don't have Google Play Services available on your device. Make sure to install them either from http://opengapps.org/ or follow tutorials online.

- No Cast devices are available.

  If you're using an emulator, make sure it's connected to the same network. For example, in Genymotion, change Configuration > Network mode to Bridge (if you do that, you'll need to explicitly set "Dev Settings" > "Debug Server Host and Port" in the React dev menu).
