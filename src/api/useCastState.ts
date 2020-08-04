import { useEffect, useState } from 'react'
import { NativeEventEmitter, NativeModules } from 'react-native'
import CastState from '../types/CastState'

const { RNGCCastContext: Native } = NativeModules
const EventEmitter = new NativeEventEmitter(Native)

export default function useCastState() {
  const [castState, setCastState] = useState<CastState>()

  useEffect(() => {
    EventEmitter.addListener(Native.CAST_STATE_CHANGED, setCastState)

    return () => {
      EventEmitter.removeListener(Native.CAST_STATE_CHANGED, setCastState)
    }
  }, [])

  return castState
}
