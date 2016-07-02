# react-native-google-cast

A library that unifies both android and iOS chromecast sdk

##Installation
`npm i react-native-google-cast --save`

#### iOS

  - Open your Xcode project
  - In `Libraries` choose `Add files...` and add the folder `ios/RNGoogleCast` from the `node_modules/react-native-google-cast/ios` folder. Be sure that the option `copy if needed` is unchecked.
  - Add `pod 'google-cast-sdk'` to your Podfile. This is the easier way to have the sdk up to date.
  - If you get an error after building the project, be sure that `$(inherited)` was added to `Other Linker Flags` in `Build Settings` 
  
       <img width="508" alt="screen shot 2016-07-01 at 11 05 32 pm" src="https://cloud.githubusercontent.com/assets/10927770/16538156/8cb11522-3fe0-11e6-98dd-4f5acbebefb9.png">
  - Rebuild your project. iOS is ready for the battle!

#### Android

**android/settings.gradle**
```
include ':react-native-google-cast'
project(':react-native-google-cast').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-google-cast/android')
```

**android/app/build.gradle**
```
dependencies {
   ...
   compile project(':react-native-google-cast')
}
```

**MainActivity.java**

On top, where imports are:
```java
import com.googlecast.GoogleCastPackage;
```

Under `new MainReactPackage()`:
`new GoogleCastPackage()`

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

  DEVICE_CHANGED,
  DEVICE_AVAILABLE,
  DEVICE_CONNECTED,
  DEVICE_DISCONNECTED,
  MEDIA_LOADED,
