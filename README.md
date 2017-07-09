[![npm version](https://badge.fury.io/js/react-native-google-cast.svg)](https://badge.fury.io/js/react-native-google-cast)
# react-native-google-cast

A library that unifies both android and iOS chromecast sdk

## Getting started

`$ npm install react-native-google-cast --save`

### Mostly automatic installation

`$ react-native link react-native-google-cast`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-google-cast` and add `RNGoogleCast.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNGoogleCast.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNGoogleCastPackage;` to the imports at the top of the file
  - Add `new RNGoogleCastPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-google-cast'
  	project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-google-cast/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-google-cast')
  	```
### iOS Heads Up
  - This library requires Cocoapods to manage Chromecast SDK.
  - Add `pod 'google-cast-sdk'` to your Podfile. This is the easier way to have the SDK up to date.

### Android Heads Up
  - This library requires Google Play Services to manage Chromecast SDK.

 ## Usage
```js
// Require the module
import Chromecast, { EVENTS } from 'react-native-google-cast';

// Init Chromecast SDK and starts looking for devices (uses DEFAULT APP ID)
Chromecast.startScan();

// Init Chromecast SDK and starts looking for devices using registered APP ID
Chromecast.startScan(APP_ID);

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
Chromecast.castMedia({ mediaUrl, title, imageUrl, seconds });

// Move the streaming media to the selected time frame
Chromecast.seekCast(TIME_IN_SECONDS);

// Toggle Chromecast between pause or play state
Chromecast.togglePauseCast();

// Get the current streaming time frame. It can be use to sync the chromecast to
// your visual media controllers
Chromecast.getStreamPosition();

```
## Events
Chromecast uses events to let you know when you should start playing with the service, like streaming the media.
```js
// To know if there are chromecasts around
DeviceEventEmitter.addListener(EVENTS.DEVICE_AVAILABLE, (existance) => console.log(existance.device_available));

// To know if the connection attempt was successful
DeviceEventEmitter.addListener(EVENTS.DEVICE_CONNECTED, () => { /* callback */ });

// If chromecast started to stream the media succesfully, it will send this event
DeviceEventEmitter.addListener(EVENTS.MEDIA_LOADED, () => { /* callback */ });

```
## Constants
```js
  DEVICE_AVAILABLE,
  DEVICE_CONNECTED,
  DEVICE_DISCONNECTED,
  MEDIA_LOADED,
```
## Example
Refer to the example folder to find an implementation of this project.
Remember to use 

* `pod install`
* `react-native link react-native-google-cast` 

to try it!

## Contribution
Contributions are welcome ! 
