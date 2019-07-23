---
id: CastButton
title: CastButton
sidebar_label: CastButton
---

The Cast button displays the Cast icon. It automatically changes appearance based on state (available, connecting, connected). If no Chromecast devices are in range, the button is not rendered.

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
