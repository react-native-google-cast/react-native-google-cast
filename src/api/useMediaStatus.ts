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
 * for that same field. There is no periodic push: a receiver playing steadily
 * sends nothing for minutes at a time, which is normal and not a dropped
 * update. Call `RemoteMediaClient.requestStatus()` to force a fresh one.
 *
 * Returns `null` when there is no active media — but note that "the media
 * stopped" usually is **not** one of those cases. On the Default Media
 * Receiver, `stop()` and removing the last queue item both leave a non-null
 * status reporting `playerState: 'idle'` (with `idleReason` `'cancelled'` /
 * `'interrupted'`), verified on device. Detect "nothing is playing" with
 * `status?.playerState === 'idle'`, not with `status === null`; `null` is for
 * "no session, or nothing has ever been loaded".
 *
 * @returns the current media status, or `null`.
 */
export function useMediaStatus(): MediaStatus | null {
  return useSyncExternalStore(
    castStore.subscribe,
    () => castStore.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
  )
}
