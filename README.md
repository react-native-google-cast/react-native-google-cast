# react-native-google-cast

A library that unifies both android and iOS chromecast sdk

## Documentation - WIP !

##Installation
npm i react-native-google-cast --save

##Linking library
WIP - RNPM is coming!
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

##Methods
**startScan()** -  *Starts the discovery process*

**getDevices()** -  *Returns the devices discovered to the moment you requested it. This is a promise*

**connectToDevice(id)** - *By sending the chromecast id, this connect the chromecast selected to your application*
