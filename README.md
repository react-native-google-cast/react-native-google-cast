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

- This library requires CocoaPods to manage Google Cast SDK.
- Add `pod 'google-cast-sdk', '~> 3.3'` to your `Podfile`.
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

## Usage

```js
// Require the module
import GoogleCast, { CastButton } from 'react-native-google-cast';

// Renders the Cast button which enables to connect to Chromecast
<CastButton />

// Streams the media to the connected Chromecast
GoogleCast.castMedia({
  mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp',
  imageUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
  title: 'Big Buck Bunny',
  subtitle: 'A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.',
  studio: 'Blender Foundation',
  duration: 596,
});
```

## Example

Refer to the [example](example/) folder to find an implementation of this project.

## Contribution

Contributions are welcome!
