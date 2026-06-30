import { useSyncExternalStore } from 'react'
import { castStore } from '../state/castStore.singleton'
import { MEDIA_SLICE_KEY, type MediaState } from '../state/media.slice'
import type { MediaStatus } from '../types/MediaStatus'

/**
 * Hook to retrieve the current media status.
 *
 * The status is pushed only when the stream's status changes, so
 * `mediaStatus.streamPosition` reflects the time of the last update, not a
 * live, ticking position — {@link useStreamPosition} is a convenience selector
 * for that same field. Returns `null` when there is no active media (no
 * session, or none loaded yet).
 *
 * @returns the current media status, or `null`.
 */
export function useMediaStatus(): MediaStatus | null {
  return useSyncExternalStore(
    castStore.subscribe,
    () => castStore.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
  )
}
