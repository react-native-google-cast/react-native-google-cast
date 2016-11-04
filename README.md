
[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)
# react-native-google-cast

A library that unifies both android and iOS chromecast sdk

## Getting started

`$ npm install react-native-google-cast --save`

### Installation

`$ react-native link react-native-google-cast`

### iOS Heads Up
  - This library requires Cocoapods to manage Chromecast SDK.
  - Add `pod 'google-cast-sdk'` to your Podfile. This is the easier way to have the SDK up to date.

##Usage##
```js
// Require the module
import Chromecast from 'react-native-google-cast';

// Init Chromecast SDK and starts looking for devices
Chromecast.startScan();

// Does what the method says. It saves resources, use it when leaving your current view
Chromecast.stopScan();

// Returns a boolean with the result
Chromecast.isConnected();

// Return an array of devices' names and ids
Chromecast.getDevices();

// Gets the device id, and connects to it. If it is successful, will send a broadcast
Chromecast.connectToDevice(DEVICE_ID);

// Closes the connection to the current Chromecast
Chromecast.disconnect();

// Streams the media to the connected chromecast. Time parameter let you choose
// in which time frame the media should start streaming
Chromecast.castMedia(MEDIA_URL, MEDIA_TITLE, MEDIA_IMAGE, TIME_IN_SECONDS);

// Move the streaming media to the selected time frame
Chromecast.seekCast(TIME_IN_SECONDS);

// Toggle Chromecast between pause or play state
Chromecast.togglePauseCast();

// Get the current streaming time frame. It can be use to sync the chromecast to
// your visual media controllers
Chromecast.getStreamPosition();

```
##Events##
Chromecast uses events to let you know when you should start playing with the service, like streaming the media.
```js
// To know if there are chromecasts around
DeviceEventEmitter.addListener(Chromecast.DEVICE_AVAILABLE, (existance) => console.log(existance.device_available));

// To know if the connection attempt was successful
DeviceEventEmitter.addListener(Chromecast.DEVICE_CONNECTED, () => { /* callback */ });

// If chromecast started to stream the media succesfully, it will send this event
DeviceEventEmitter.addListener(Chromecast.MEDIA_LOADED, () => { /* callback */ });

```
##Constants##
```js
  DEVICE_AVAILABLE,
  DEVICE_CONNECTED,
  DEVICE_DISCONNECTED,
  MEDIA_LOADED,
```
##Example##
Refer to the example folder to find an implementation of this project

## Contribution
Contributions are welcome !
