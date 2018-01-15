[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)
# react-native-google-cast

Supports Google Cast SDK v3 for Android and iOS.

> Migration to v3 is a WIP. More functionality will become available as implemented.

## Getting started

```
$ npm install react-native-google-cast --save
$ react-native link react-native-google-cast
```

### iOS Setup

- This library requires [CocoaPods](https://cocoapods.org/) to manage Google Cast SDK.
- Add `pod 'google-cast-sdk', '~> 3'` to your `Podfile`.
- In `AppDelegate.m` add
  ```obj-c
  #import <GoogleCast/GoogleCast.h>
  ```
  and in the `didFinishLaunchingWithOptions` method add:
  ```obj-c
  GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKMediaDefaultReceiverApplicationID];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

### Android Setup

- This library requires Google Play Services, Media Router and Google Cast dependencies to manage Google Cast SDK.
- Add into your app's `build.gradle` dependencies
  ```
  compile 'com.google.android.gms:play-services-cast:9.4.0'
  compile 'com.android.support:mediarouter-v7:23.0.1'
  ```
  `mediarouter` version must match with your `appcompat` version.
- Add to `AndroidManifest.xml`
  ```xml
  <meta-data
    android:name=   "com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
    android:value="com.googlecast.GoogleCastOptionsProvider" />
  ```
- Also make sure the device you're using (also applies to emulators) has Google Play Services installed.

## Usage

```js
// Require the module
import GoogleCast, { CastButton } from 'react-native-google-cast';

// Render the Cast button which enables to connect to Chromecast
<CastButton style={{width: 24, height: 24}} />

// Stream the media to the connected Chromecast
GoogleCast.castMedia({
  mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
  imageUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
  title: 'Big Buck Bunny',
  subtitle: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
  studio: 'Blender Foundation',
  duration: 596,
});
```

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
    <CastButton style={{width: 24, height: 24}} />
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

To use the default expanded controller, enable it in the cast context.

- iOS: in `AppDelegate.m`'s `didFinishLaunchingWithOptions` method add:
  ```obj-c
  [GCKCastContext sharedInstance].useDefaultExpandedMediaControls = YES;
  ```

Then, to load the expanded controller, call

```js
GoogleCast.launchExpandedControls();
```

The expanded controller will also be launched automatically when the user taps the mini controller.

## Events

The library emits events to inform you about current state.

### Session Events

A session is an end-to-end connection from a sender application (mobile app) to a receiver application (on Chromecast).

```js
import GoogleCast from 'react-native-google-cast';

// Establishing connection to Chromecast
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTING, () => { /* callback */ });

// Connection established
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => { /* callback */ });

// Connection failed
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_START_FAILED, (error) => { console.error(error) });

// Connection suspended (your application went to background or disconnected)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_SUSPENDED, () => { /* callback */ });

// Attempting to reconnect
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMING, () => { /* callback */ });

// Reconnected
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMED, () => { /* callback */ });

// Disconnecting
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDING, () => { /* callback */ });

// Disconnected (error provides explanation if ended forcefully)
GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, (error) => { /* callback */ });
```

## Example

Refer to the [example](example/) folder to find an implementation of this project.

## Contribution

1. Contributions are welcome!
2. Fork the repo.
3. Implement your shiny new thing.
4. Demonstrate how to use it in the example project.
5. Document the functionality in the README (here).
6. PR
