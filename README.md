[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK v4 for Android and iOS, providing a unified JavaScript interface.

> Migration to v4 is a work in progress. If some functionality does not exist yet, please open a ticket or make a pull request :)

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
      buildToolsVersion = '27.0.3'
      minSdkVersion = 16
      compileSdkVersion = 27
      targetSdkVersion = 26
      supportLibVersion = '26.1.0'
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
