[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)

# react-native-google-cast

This library wraps the native Google Cast SDK v3 for iOS and Android, providing a unified JavaScript interface.

> This is a complete rewrite of the library. If you're still using v1, please check the [v1 branch](https://github.com/react-native-google-cast/react-native-google-cast/tree/v1).

> There's a yet new version in the works that closely resembles the native APIs. All new feature requests will be directed there. If you want to check it out, visit the [v4 branch](https://github.com/react-native-google-cast/react-native-google-cast/tree/v4).

## Getting started

```sh
$ npm install react-native-google-cast
```

or

```sh
$ yarn add react-native-google-cast
```

### Installation

<details>
  <summary>Linker</summary>

```
$ react-native link react-native-google-cast
```

Note: This will only link the react-native-google-cast library. You'll still need to add Google Cast SDK using the steps below.

</details>

<details>
  <summary>iOS (CocoaPods)</summary>

- Install [CocoaPods](https://cocoapods.org/)

- Setup your Podfile like it is described in the [react-native documentation](https://facebook.github.io/react-native/docs/integration-with-existing-apps#configuring-cocoapods-dependencies).

- Add `pod 'google-cast-sdk', '~> 3'` to your `Podfile`. Alternatively, you can try SDK v4 by using `pod 'google-cast-sdk', '4.3.0'` (see setup below).

- Add `pod 'react-native-google-cast', path: '../node_modules/react-native-google-cast/ios/'` to your `Podfile`

- Run `pod install`

</details>

<details>
  <summary>iOS (Manually)</summary>

- In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`

- Go to `node_modules` ➜ `react-native-google-cast` and add `RNGoogleCast.xcodeproj`

- In XCode, in the project navigator, select your project. Add `libRNGoogleCast.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`

- Follow the [instructions](https://developers.google.com/cast/docs/ios_sender/#google_cast_sdk) to install the Google Cast SDK

</details>

<details>
  <summary>Android</summary>

1. Open up `android/app/src/main/java/[...]/MainApplication.java`

   - Add `import com.reactnative.googlecast.GoogleCastPackage;` to the imports at the top of the file
   - Add `new GoogleCastPackage()` to the list returned by the `getPackages()` method

2. Append the following lines to `android/settings.gradle`:

   ```java
   include ':react-native-google-cast'
   project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-google-cast/android')
   ```

3. Insert the following lines inside the `dependencies` block in `android/app/build.gradle`:

   ```java
   dependencies {
     implementation project(':react-native-google-cast')
   }
   ```

4. By default, the react-native-google-cast package automatically loads the latest version (`+`) of the Cast SDK and support libraries as its dependencies. To use a specific version, set it in the root `android/build.gradle`:

   ```java
   buildscript {
     ext {
       buildToolsVersion = "27.0.3"
       minSdkVersion = 16
       compileSdkVersion = 27
       targetSdkVersion = 26
       supportLibVersion = "26.1.0"
       castFrameworkVersion = '16.1.2'
     }
   }
   ```

</details>

### Setup

<details>
  <summary>iOS</summary>

- In `AppDelegate.m` add

```obj-c
#import <GoogleCast/GoogleCast.h>
```

- If you're using SDK v3, in `AppDelegate.m` in the `didFinishLaunchingWithOptions` method add:

  ```obj-c
  GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKMediaDefaultReceiverApplicationID];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

  (or replace `kGCKMediaDefaultReceiverApplicationID` with your custom Cast app id).

- If you're using SDK v4, use this code instead:

  ```obj-c
  GCKDiscoveryCriteria *criteria = [[GCKDiscoveryCriteria alloc] initWithApplicationID:kGCKDefaultMediaReceiverApplicationID];
  GCKCastOptions* options = [[GCKCastOptions alloc] initWithDiscoveryCriteria:criteria];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

  Currently, the only thing using SDK v4 will do is improve discoverability in iOS 12 / Xcode 10 by enabling [Access WiFi Information](https://developers.google.com/cast/docs/ios_sender/) in: `your target > capabilities`. New features of the SDK V4 are planned to be added in v4 of this library.

</details>

<details>
  <summary>Android</summary>

- Make sure the device you're using (also applies to emulators) has Google Play Services installed.

- Add to `AndroidManifest.xml`

  ```xml
  <meta-data
    android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
    android:value="com.reactnative.googlecast.GoogleCastOptionsProvider" />
  ```

  Alternatively, you may provide your own `OptionsProvider` class. For example, to use a custom receiver app:

  ```java
  package com.foo;

  import com.reactnative.googlecast.GoogleCastOptionsProvider;

  public class CastOptionsProvider extends GoogleCastOptionsProvider {
    @Override
    public CastOptions getCastOptions(Context context) {
      CastOptions castOptions = new CastOptions.Builder()
          .setReceiverApplicationId(context.getString(R.string.app_id))
          .build();
      return castOptions;
    }
  }
  ```

  and don't forget to set your `AndroidManifest.xml`:

  ```xml
  <meta-data
    android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
    android:value="com.foo.GoogleCastOptionsProvider" />
  ```

- Change your `MainActivity` to extend `GoogleCastActivity`.

  ```java
  import com.facebook.react.GoogleCastActivity;

  public class MainActivity extends GoogleCastActivity {
    // ..
  }
  ```

  If you already extend other class than `ReactActivity` (e.g. if you use `react-native-navigation`) or integrate React Native in native app, make sure that the `Activity` is a descendant of `android.support.v7.app.AppCompatActivity`. Then add `CastContext.getSharedInstance(this);` to your `Activity`'s `onCreate` method (this lazy loads the Google Cast context).

</details>

## Usage

```js
// Require the module
import GoogleCast, { CastButton } from 'react-native-google-cast'

// Render the Cast button which enables to connect to Chromecast
;<CastButton style={{ width: 24, height: 24 }} />

// Stream the media to the connected Chromecast
GoogleCast.castMedia({
  mediaUrl:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
  imageUrl:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
  title: 'Big Buck Bunny',
  subtitle:
    'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
  studio: 'Blender Foundation',
  streamDuration: 596, // seconds
  contentType: 'video/mp4', // Optional, default is "video/mp4"
  playPosition: 10, // seconds
  customData: {
    // Optional, your custom object that will be passed to as customData to reciever
    customKey: 'customValue',
  },
})
```

## API

- `GoogleCast.getCastState().then((state: 'NoDevicesAvailable' | 'NotConnected' | 'Connecting' | 'Connected' }) => { ... })`
- `GoogleCast.getCastDevice().then((device: { id, model, name, version }) => { ... })`
- `GoogleCast.castMedia(options)`
- `GoogleCast.play()`
- `GoogleCast.pause()`
- `GoogleCast.seek(playPosition)` - jump to position in seconds from the beginning of the stream
- `GoogleCast.stop()`
- `GoogleCast.endSession(stopCasting)`
- `GoogleCast.initChannel('urn:x-cast:...')` - initialize custom channel for communication with Cast receiver app. Once you do this, you can subscribe to `CHANNEL_*` events.
- `GoogleCast.sendMessage('urn:x-cast:...', message)` - send message over the custom channel

## Components

The Google Cast SDK comes with a set of useful UI components.

### Cast Button

The Cast button displays the Cast icon. It automatically changes appearance based on state (available, connecting, connected). If no Chromecasts are in range, the button is not rendered.

When clicking the button, the native [Cast Dialog](https://developers.google.com/cast/docs/design_checklist/cast-dialog) is presented which enables the user to connect to a Chromecast, and, when casting, to play/pause and change volume.

```js
import { CastButton } from 'react-native-google-cast'

// ...
  render() {
    // ...
    <CastButton style={{width: 24, height: 24, tintColor: 'black'}} />
  }
```

The default Cast button behavior can be customized but this is not supported yet by this library.

### Introductory Overlay

The [introductory overlay](https://developers.google.com/cast/docs/design_checklist/cast-button#prompting) highlights the Cast button for new users when they're near a Chromecast device for the first time. The native framework will make sure it is only ever shown to the user once.

You should include the `showIntroductoryOverlay` callback to every screen that contains the Cast button.

```js
componentDidMount() {
  GoogleCast.showIntroductoryOverlay();
}
```

### Mini Media Control

TODO

### Expanded Media Control

The [expanded controller](https://developers.google.com/cast/docs/design_checklist/sender#sender-expanded-controller) is a full screen view which offers full control of the remote media playback. This view should allow a casting app to manage every manageable aspect of a cast session, with the exception of receiver volume control and session lifecycle (connect/stop casting). It also provides all the status information about the media session (artwork, title, subtitle, and so forth).

To use the default expanded controller:

- iOS: in `AppDelegate.m`'s `didFinishLaunchingWithOptions` method add

  ```obj-c
  [GCKCastContext sharedInstance].useDefaultExpandedMediaControls = YES;
  ```

- Android: in `AndroidManifest.xml` add

  ```xml
  <activity android:name="com.reactnative.googlecast.GoogleCastExpandedControlsActivity" />
  ```

Then, to load the expanded controller, call

```js
GoogleCast.launchExpandedControls()
```

The expanded controller will also be launched automatically when the user taps the mini controller.

### Volume Control

The Cast framework automatically manages the volume for the sender app and synchronizes the sender and receiver apps so that the sender UI always reports the volume specified by the receiver.

Physical button volume control is automatically enabled on Android. On iOS, you need to enable it when initializing the cast context:

```obj-c
GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKMediaDefaultReceiverApplicationID];
options.physicalVolumeButtonsWillControlDeviceVolume = YES;
[GCKCastContext setSharedInstanceWithOptions:options];
```

Programmatic access to the volume will be added in a future version.

## Events

The library emits events to inform you about current state.

### Session Events

A session is an end-to-end connection from a sender application (mobile app) to a receiver application (on Chromecast).

```js
import GoogleCast from 'react-native-google-cast'

// Establishing connection to Chromecast
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTING, () => {
  /* callback */
})

// Connection established
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => {
  /* callback */
})

// Connection failed
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_START_FAILED, error => {
  console.error(error)
})

// Connection suspended (your application went to background or disconnected)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_SUSPENDED, () => {
  /* callback */
})

// Attempting to reconnect
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMING, () => {
  /* callback */
})

// Reconnected
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMED, () => {
  /* callback */
})

// Disconnecting
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDING, () => {
  /* callback */
})

// Disconnected (error provides explanation if ended forcefully)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, error => {
  /* callback */
})
```

### Media Events

Remote media client controls media playback on a Cast receiver.

```js
// Status of the media has changed. The `mediaStatus` object contains the new status.
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_STATUS_UPDATED,
  ({ mediaStatus }) => {},
)
```

For convenience, the following events are triggered in addition to `MEDIA_STATUS_UPDATED` in these special cases (they're called after `MEDIA_STATUS_UPDATED`, if you're subscribed to them).

```js
// Media started playing
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_PLAYBACK_STARTED,
  ({ mediaStatus }) => {},
)

// Media finished playing
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_PLAYBACK_ENDED,
  ({ mediaStatus }) => {},
)

// Playing progress of the media has changed. The `mediaProgress` object contains the duration and new progress.
GoogleCast.EventEmitter.addListener(
  GoogleCast.MEDIA_PROGRESS_UPDATED,
  ({ mediaProgress }) => {},
)
```

### Channel Events

A virtual communication channel for exchanging messages between a Cast sender (mobile app) and a Cast receiver (on Chromecast).

Each channel is tagged with a unique namespace, so multiple channels may be multiplexed over a single network connection between a sender and a receiver.

A channel must be registered by calling `GoogleCast.initChannel('urn:x-cast:...')` before it can be used. When the associated session is established, the channel will be connected automatically and can then send and receive messages.

⚠️ To process custom events, you will need to create a custom receiver (CAF) as demonstrated in the [example project](example/receiver/index.html). Please note that, by default, CAF tries to parse the message as JSON (only the receiver does this, not the sender). More information in [this issue, specifically #7](https://issuetracker.google.com/issues/117136854#comment7).

```js
// Communication channel established
// ⚠️ iOS only
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_CONNECTED,
  ({ channel }) => {},
)

// Communication channel terminated
// ⚠️ iOS only
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_DISCONNECTED,
  ({ channel }) => {},
)

// Message received
GoogleCast.EventEmitter.addListener(
  GoogleCast.CHANNEL_MESSAGE_RECEIVED,
  ({ channel, message }) => {},
)

// Send message
GoogleCast.sendMessage(channel, message)
```

## Device

Information about connected Chromecast devices.

```js
// Get information about the currently connected device
GoogleCast.getCurrentDevice().then(device => {
  // device : {id, model, name, version}
})
```

## Example

Refer to the [example](example/) folder to find an implementation of this project.

## Troubleshooting

- _Android:_ `com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.`

  You don't have Google Play Services available on your device. Make sure to install them either from http://opengapps.org/ or follow tutorials online.

  TODO: Handle gracefully and ignore the Cast library without crashing.

- _Android\*_ `java.lang.IllegalStateException: The activity must be a subclass of FragmentActivity`

  Make sure your `MainActivity` extends `GoogleCastActivity`, `AppCompatActivity`, or some other descendant of `FragmentActivity`.

## Contribution

1. Contributions are welcome!
2. Fork the repo.
3. Implement your shiny new thing.
4. Demonstrate how to use it in the example project.
5. Make sure to manually test that the example project works as intended.\*
6. Document the functionality in the README (here).
7. PR

\* To test with a custom receiver:

- create a new custom app in [Cast Publish](https://cast.google.com/publish)
- `npm i -g serve`
- `serve -l PORT -s example/receiver/`
- set the app id in `example/ios/RNGCE/AppDelegate.m` (iOS) and `OptionsProvider` (Android)
- you can debug the receiver in Chrome by navigating to <chrome://inspect>
