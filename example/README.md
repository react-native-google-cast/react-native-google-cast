## react-native-google-cast example project

### Setup

* `cd ios && pod install`
* `react-native link react-native-google-cast`


## Troubleshooting

- `#include <GoogleCast/GoogleCast.h> cannot be found`

  XCode doesn't like symlinked projects. Make sure `node_modules/react-native-google-cast/` is copied over instead of symlinked (`npm install` should do this automatically).

- `com.google.android.gms.dynamite.DynamiteModule$zza: No acceptable module found. Local version is 0 and remote version is 0.`

  You don't have Google Play Services available on your device. Make sure to install them either from http://opengapps.org/ or follow tutorials online.
