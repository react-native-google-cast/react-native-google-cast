[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK for Android and iOS, providing a unified JavaScript interface.

It is written in TypeScript so types will always be up-to-date.

> Migration to v4 is a work in progress. If some functionality does not exist yet, please open a ticket or make a pull request :)

## Version overview

| RNGC | React Native | Purpose                                                                                                                                               |
| ---- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.x  | Not sure :)  | Old version implemented for Google Cast SDK v2 with manual discoverability. Not maintained anymore.                                                   |
| 3.x  | >=0.40       | Rewrite of the library for Google Cast SDK v3 with automatic session management. Only bug fixes will be merged.                                       |
| 4.x  | >=0.60\*     | Current version with a completely rewritten API, closely resembling native Android/iOS(/Chrome?) APIs. We highly recommend to use the latest version. |

\* While v4.x is built with the latest changes in RN 0.60 (auto-linking, AndroidX, CocoaPods), you might still be able to use it with an older RN version by using [jetifier](https://github.com/mikehardy/jetifier#usage-for-source-files) (and vice versa for 3.x)

## Documentation

TODO link

## Example

Refer to the [example](example/) folder to find a React Native version of the CastVideos reference app.

## Playground

Refer to the [playground](playground/) folder to find a sample app demonstrating the available APIs provided by the library.

## Troubleshooting

- _Android:_ `com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.`

  You don't have Google Play Services available on your device. Make sure to install them either from http://opengapps.org/ or follow tutorials online.

  TODO: Handle gracefully and ignore the Cast library without crashing.

- _Android:_ If you're having version conflicts of the appcompat (or google play services) libraries, make sure you set versions globally in your project's top-level `build.gradle`:

  ```gradle
  buildscript {
    ext {
      buildToolsVersion = '28.0.3'
      minSdkVersion = 16
      compileSdkVersion = 28
      targetSdkVersion = 28
      supportLibVersion = '28.0.0'
      castFrameworkVersion = '16.1.2'
    }
    ...
  }
  ```

- _Android\*_ `java.lang.IllegalStateException: The activity must be a subclass of FragmentActivity`

  Make sure your `MainActivity` extends `GoogleCastActivity`, `AppCompatActivity`, or some other descendant of `FragmentActivity`.

## Contribution

1. Contributions are welcome!
2. Fork the repo.
3. Implement your shiny new thing.
4. Demonstrate how to use it in the example project.
5. Document the functionality in the README (here).
6. PR
