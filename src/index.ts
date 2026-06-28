// Public entry point for react-native-google-cast v5.
// Barrel file: re-exports only (no implementation logic).

export { castTransport } from './transport/CastTransport'
export type {
  CastTransportApi,
  CastState,
  ListenerSubscription,
} from './transport/types'
export type { CastError, CastErrorCode } from './types/CastError'
