---
id: hooks
title: Hooks
sidebar_label: Hooks
---

If you're using functional components, the library provides a number of hooks that help you manage its state.

## Cast State Hook

Receive the current [CastState](../api/enums/caststate).

```js
import { useCastState } from 'react-native-google-cast'

const castState = useCastState()
```

## Session Hook

Receive the current [CastSession](../api/classes/castsession).

```js
import { useCastSession } from 'react-native-google-cast'

const castSession = useCastSession()
```

## Client Hook

Receive the current [RemoteMediaClient](../api/classes/remotemediaclient).

```js
import { useClient } from 'react-native-google-cast'

const client = useClient()
```
