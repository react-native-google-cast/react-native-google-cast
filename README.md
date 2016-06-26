# react-native-google-cast

A library that unifies both android and iOS chromecast sdk

## Documentation - WIP !

##Installation
npm i react-native-google-cast --save

#### iOS


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
    js
    // Require the module
    import Chromecast from "react-native-google-cast";
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
