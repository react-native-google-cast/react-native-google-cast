import { useEffect, useState } from 'react'
import { NativeEventEmitter, NativeModules } from 'react-native'
import CastSession from './CastSession'

const { RNGCSessionManager: Native } = NativeModules
const EventEmitter = new NativeEventEmitter(Native)

export default function useCastSession() {
  const [castSession, setCastSession] = useState<CastSession>()

  useEffect(() => {
    Native.getCurrentCastSession().then(setCastSession)

    EventEmitter.addListener(Native.SESSION_STARTED, setCastSession)
    EventEmitter.addListener(Native.SESSION_SUSPENDED, () =>
      setCastSession(undefined)
    )
    EventEmitter.addListener(Native.SESSION_RESUMED, setCastSession)
    EventEmitter.addListener(Native.SESSION_ENDING, () =>
      setCastSession(undefined)
    )

    return () => {
      EventEmitter.removeListener(Native.SESSION_STARTED, setCastSession)
      EventEmitter.removeListener(Native.SESSION_SUSPENDED, setCastSession)
      EventEmitter.removeListener(Native.SESSION_RESUMED, setCastSession)
      EventEmitter.removeListener(Native.SESSION_ENDING, setCastSession)
    }
  }, [])

  return castSession
}
