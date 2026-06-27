import { NitroModules } from 'react-native-nitro-modules'
import type { CastTransport } from '../specs/CastTransport.nitro'
import type { CastTransportApi } from './types'

/**
 * Native (iOS/Android) Cast transport, backed by the Nitro `CastTransport`
 * HybridObject and the Google Cast SDK. Resolved by the bundler on native via
 * the `.native.ts` extension.
 */
export const castTransport: CastTransportApi =
  NitroModules.createHybridObject<CastTransport>('CastTransport')
