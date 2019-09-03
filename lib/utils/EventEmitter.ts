import { DeviceEventEmitter, NativeEventEmitter, Platform } from 'react-native'

export default function EventEmitter(module: any) {
  return Platform.OS === 'ios'
    ? new NativeEventEmitter(module)
    : DeviceEventEmitter
}
