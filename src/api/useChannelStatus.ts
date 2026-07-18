import { useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import {
  CHANNEL_SLICE_KEY,
  type ChannelState,
  type ChannelStatus,
} from '../state/channel.slice'

/**
 * Hook returning the live connection status of the custom channel registered
 * for `namespace`, or `null` while no such channel is registered (no session,
 * or the channel hasn't been added / was removed).
 *
 * This is the **reactive** counterpart to the point-in-time
 * {@link CastChannel.connected} / {@link CastChannel.writable} getters: a
 * component using this hook re-renders when the status changes. The returned
 * object is frozen and referentially stable while the status is unchanged.
 *
 * Platform note (same as the getters): iOS streams real dynamic values — often
 * `connected: false` right after {@link CastSession.addChannel} until the
 * connection completes; Android reports `{connected: true, writable: true}`
 * once at registration and never updates (its SDK has no per-channel
 * callbacks).
 *
 * @param namespace custom channel namespace starting with `urn:x-cast:`.
 * @returns the channel's status, or `null`.
 *
 * @example
 * ```js
 * import { useCastChannel, useChannelStatus } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const channel = useCastChannel('urn:x-cast:com.example.custom')
 *   const status = useChannelStatus('urn:x-cast:com.example.custom')
 *
 *   // disable the send button until the receiver end is up
 *   const canSend = status?.writable ?? false
 * }
 * ```
 */
export function useChannelStatus(namespace: string): ChannelStatus | null {
  return useSyncExternalStore(
    castStore.subscribe,
    () =>
      castStore.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
        namespace
      ] ?? null
  )
}
