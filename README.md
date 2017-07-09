
# react-native-google-cast

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

#### Windows
[Read it! :D](https://github.com/ReactWindows/react-native)

1. In Visual Studio add the `RNGoogleCast.sln` in `node_modules/react-native-google-cast/windows/RNGoogleCast.sln` folder to their solution, reference from their app.
2. Open up your `MainPage.cs` app
  - Add `using Com.Reactlibrary.RNGoogleCast;` to the usings at the top of the file
  - Add `new RNGoogleCastPackage()` to the `List<IReactPackage>` returned by the `Packages` method


## Usage
```javascript
import RNGoogleCast from 'react-native-google-cast';

// TODO: What to do with the module?
RNGoogleCast;
```
  