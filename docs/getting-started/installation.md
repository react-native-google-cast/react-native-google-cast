---
id: installation
title: Installation
sidebar_label: Installation
---

`$ npm install react-native-google-cast --save`

or

`$ yarn add react-native-google-cast`

## Link package

`$ react-native link react-native-google-cast`

Sometimes based on your project configuration this doesn't link the package properly. In that case please link it manually:

### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-google-cast` and add `RNGoogleCast.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNGoogleCast.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)

### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`

   - Add `import com.reactnative.googlecast.RNGoogleCastPackage;` to the imports at the top of the file
   - Add `new RNGoogleCastPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:

   ```
   include ':react-native-google-cast'
   project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-google-cast/android')
   ```

3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:

   ```
   implements project(':react-native-google-cast')
   ```
