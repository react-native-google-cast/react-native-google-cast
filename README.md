[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)
# react-native-google-cast

This library wraps the native Google Cast SDK v3 for Android and iOS, providing a unified JavaScript interface.

> Migration to v3 is a WIP. If some functionality does not exist yet, please open a ticket or make a pull request :)

## Getting started

**This version is not deployed to npm yet. Please install directly from github:**

```
$ npm install github:flextv/react-native-google-cast --save
$ react-native link react-native-google-cast
```

### iOS Setup

- Install [CocoaPods](https://cocoapods.org/)

- Add `pod 'google-cast-sdk', '~> 3'` to your `Podfile` and run `pod install`.

- In `AppDelegate.m` add

  ```obj-c
  #import <GoogleCast/GoogleCast.h>
  ```

  and in the `didFinishLaunchingWithOptions` method add:

  ```obj-c
  GCKCastOptions *options = [[GCKCastOptions alloc] initWithReceiverApplicationID:kGCKMediaDefaultReceiverApplicationID];
  [GCKCastContext setSharedInstanceWithOptions:options];
  ```

  (or replace `kGCKMediaDefaultReceiverApplicationID` with your custom Cast app id).

### Android Setup

- Make sure the device you're using (also applies to emulators) has Google Play Services installed.

- Add to `AndroidManifest.xml`

  ```xml
  <meta-data
    android:name="com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME"
    android:value="com.googlecast.GoogleCastOptionsProvider" />
  ```

  Alternatively, you may provide your own `OptionsProvider` class.

- Change your `MainActivity` to extend `GoogleCastActivity`.

  ```java
  import com.facebook.react.GoogleCastActivity;

  public class MainActivity extends GoogleCastActivity {
    // ..
  }
  ```

  If you already extend other class than `ReactActivity` (e.g. if you use `react-native-navigation`) or integrate React Native in native app, make sure that the `Activity` is a descendant of `android.support.v7.app.AppCompatActivity`. Then add `CastContext.getSharedInstance(this);` to your `Activity`'s `onCreate` method (this lazy loads the Google Cast context).

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
  streamDuration: 596, // seconds
  playPosition: 10, // seconds
});
```

## API

- `GoogleCast.getCastState().then(state => {})`
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
  <activity android:name="com.googlecast.GoogleCastExpandedControlsActivity" />
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

### Media Events

Remote media client controls media playback on a Cast receiver.

```js
// Status of the media has changed. The `mediaStatus` object contains the new status.
GoogleCast.EventEmitter.addListener(GoogleCast.MEDIA_STATUS_UPDATED, ({mediaStatus}) => {});
```

For convenience, the following events are triggered in addition to `MEDIA_STATUS_UPDATED` in these special cases (they're called after  `MEDIA_STATUS_UPDATED`, if you're subscribed to them).

```js
// Media started playing
GoogleCast.EventEmitter.addListener(GoogleCast.MEDIA_PLAYBACK_STARTED, ({mediaStatus}) => {});

// Media finished playing
GoogleCast.EventEmitter.addListener(GoogleCast.MEDIA_PLAYBACK_ENDED, ({mediaStatus}) => {});

// Playing progress of the media has changed. The `mediaProgress` object contains the duration and new progress.
GoogleCast.EventEmitter.addListener(GoogleCast.MEDIA_PROGRESS_UPDATED, ({mediaProgress}) => {});
```

### Channel Events

A virtual communication channel for exchanging messages between a Cast sender (mobile app) and a Cast receiver (on Chromecast).

Each channel is tagged with a unique namespace, so multiple channels may be multiplexed over a single network connection between a sender and a receiver.

A channel must be registered by calling `GoogleCast.initChannel('urn:x-cast:...')` before it can be used. When the associated session is established, the channel will be connected automatically and can then send and receive messages.

```js
// Communication channel established
GoogleCast.EventEmitter.addListener(GoogleCast.CHANNEL_CONNECTED, ({namespace}) => {});

// Communication channel terminated
GoogleCast.EventEmitter.addListener(GoogleCast.CHANNEL_DISCONNECTED, ({namespace}) => {});

// Message received
GoogleCast.EventEmitter.addListener(GoogleCast.CHANNEL_MESSAGE_RECEIVED, ({namespace, message}) => {});

// Send message
GoogleCast.sendMessage(namespace, message)
```

## Example

Refer to the [example](example/) folder to find an implementation of this project.

## Troubleshooting

- `com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.`

  You don't have Google Play Services available on your device. Make sure to install them either from http://opengapps.org/ or follow tutorials online.

  TODO: Handle gracefully and ignore the Cast library without crashing.

- If you're having version conflict with another library that also uses the appcompat (or google play services) package, the simplest solution is to add to `build.gradle`:

  ```gradle
  compile 'com.android.support:appcompat-v7:25.0.0'
  compile 'com.android.support:mediarouter-v7:25.0.0'
  ```

  You can use any version >=25. This will force all libraries to use this specific version.

## Contribution

1. Contributions are welcome!
1. Fork the repo.
1. Implement your shiny new thing.
1. Demonstrate how to use it in the example project.
1. Document the functionality in the README (here).
1. PR
