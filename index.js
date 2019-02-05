// @flow

import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native'

import CastButton from './lib/components/CastButton'

import CastContext from './lib/api/CastContext'

import MediaInfo from './lib/api/MediaInfo'
import MediaLoadOptions from './lib/api/MediaLoadOptions'
import * as MediaMetadata from './lib/api/MediaMetadata'

import RemoteMediaClient from './lib/api/RemoteMediaClient'

import WebImage from './lib/api/WebImage'

export {
  CastButton,
  CastContext,
  MediaInfo,
  MediaLoadOptions,
  MediaMetadata,
  RemoteMediaClient,
  WebImage,
}
