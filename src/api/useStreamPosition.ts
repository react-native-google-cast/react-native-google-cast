import { useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { MEDIA_SLICE_KEY, type MediaState } from '../state/media.slice'

/**
 * Hook to retrieve the current stream position, in seconds.
 *
 * Driven by the media-status stream, so it updates whenever the receiver reports
 * a new status (not on a real-time client tick). Returns `null` when there is no
 * active media.
 *
 * @returns the current position in seconds, or `null`.
 */
export function useStreamPosition(): number | null {
  return useSyncExternalStore(castStore.subscribe, () => {
    const status =
      castStore.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
    return status ? status.streamPosition : null
  })
}
