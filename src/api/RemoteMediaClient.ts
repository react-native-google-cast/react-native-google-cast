import type { AnyMap } from 'react-native-nitro-modules'
import type { CastError, CastTransportApi } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import type { EventSubscription } from './subscribeSelector'
import { progressTicker } from '../state/progressTicker.singleton'
import { MEDIA_SLICE_KEY, type MediaState } from '../state/media.slice'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaRepeatMode } from '../types/MediaRepeatMode'
import type { MediaSeekOptions } from '../types/MediaSeekOptions'
import type { MediaStatus } from '../types/MediaStatus'
import type { TextTrackStyle } from '../types/TextTrackStyle'

/** The store capability the client needs: the live generation + the media slice. */
type MediaStoreView = Pick<CastStore, 'getCurrentGeneration' | 'getSliceState'>

/**
 * Per-store memo of the live client, keyed by the store instance so two stores
 * (e.g. parallel jest cases) never share a handle. Keyed-by-generation inside,
 * so {@link RemoteMediaClient.current} hands back a referentially-stable client
 * within a session — what `useRemoteMediaClient`'s `useSyncExternalStore`
 * `getSnapshot` needs to avoid an over-render loop.
 */
const cache = new WeakMap<
  object,
  { generation: number; client: RemoteMediaClient }
>()

/**
 * Controls a media player running on the Cast receiver — a thin façade over the
 * singleton transport. Mutations route to the transport's RemoteMediaClient
 * surface; reads are served synchronously from the central store's media slice.
 *
 * Like {@link CastSession}, it is bound to the lifecycle **generation** at which
 * its session became live, so a handle retained across a disconnect is *stale*:
 * {@link assertActive} rejects mutations with `noSession` before they cross the
 * bridge, and reads return `null` rather than leaking a later session's status
 * (Invariant 3, media flavour). Obtain one via the {@link useRemoteMediaClient}
 * hook; never construct or cache it directly.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/framework/media/RemoteMediaClient) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_remote_media_client) _GCKRemoteMediaClient_ | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.RemotePlayer) _RemotePlayer_
 *
 * @example
 * ```ts
 * import { useRemoteMediaClient } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const client = useRemoteMediaClient()
 *   client?.loadMedia({
 *     mediaInfo: { contentUrl: 'https://.../BigBuckBunny.mp4' },
 *   })
 * }
 * ```
 */
export class RemoteMediaClient {
  private readonly store: MediaStoreView
  private readonly transport: CastTransportApi
  private readonly generation: number

  /**
   * The live client for the current session, memoized per generation, or `null`
   * when there is no session. Internal — the hook layer's `getSnapshot`.
   */
  static current(
    store: CastStore,
    transport: CastTransportApi
  ): RemoteMediaClient | null {
    const session = store.getSnapshot().currentSession
    if (!session) {
      cache.delete(store)
      return null
    }
    const cached = cache.get(store)
    if (cached && cached.generation === session.generation) {
      return cached.client
    }
    const client = new RemoteMediaClient(store, transport, session.generation)
    cache.set(store, { generation: session.generation, client })
    return client
  }

  constructor(
    store: MediaStoreView,
    transport: CastTransportApi,
    generation: number
  ) {
    this.store = store
    this.transport = transport
    this.generation = generation
  }

  /** Whether this handle still refers to the current live session. */
  get isActive(): boolean {
    return this.store.getCurrentGeneration() === this.generation
  }

  /**
   * Guard every bridge-crossing mutation must call first. Throws a
   * {@link CastError} `noSession` the instant this handle is stale; because the
   * mutations are `async`, that surfaces to the caller as a rejected promise.
   */
  private assertActive(): void {
    if (!this.isActive) {
      const error: CastError = {
        code: 'noSession',
        message: 'This media session has ended.',
      }
      throw error
    }
  }

  // --- reads (synchronous; served from the media slice cache) ---

  /** The current media status, or `null` if there is no media (or stale handle). */
  getMediaStatus(): MediaStatus | null {
    if (!this.isActive) return null
    return this.store.getSliceState<MediaState>(MEDIA_SLICE_KEY).currentStatus
  }

  /**
   * The current stream position in seconds, or `null` if there is no media. Note
   * this is the position at the *last status update*, not a real-time tick.
   */
  getStreamPosition(): number | null {
    const status = this.getMediaStatus()
    return status ? status.streamPosition : null
  }

  /**
   * Listen for ticking progress of the currently playing media. The handler
   * receives `(position, duration)` in seconds, driven by a shared TS ticker
   * (position advances locally while playing, resyncing on each status push).
   *
   * Unlike v4 (single listener), v5 supports multiple concurrent listeners;
   * differing intervals share one timer at the smallest interval.
   *
   * Scoped to this handle's generation like every other read: a stale client
   * returns a no-op subscription, and a live one auto-unsubscribes the instant
   * its session ends, so it can never leak a later session's progress.
   *
   * @param handler called with `(position, duration)` on each update.
   * @param interval update frequency in seconds (default `1`).
   * @returns a subscription; call `remove()` to stop listening.
   */
  onMediaProgressUpdated(
    handler: (position: number, duration: number) => void,
    interval = 1
  ): EventSubscription {
    if (!this.isActive) return { remove: () => {} }

    let unsubscribe = () => {}
    unsubscribe = progressTicker.subscribe(() => {
      if (!this.isActive) {
        unsubscribe()
        return
      }
      const position = progressTicker.getPosition()
      if (position !== null) handler(position, progressTicker.getDuration())
    }, interval)
    return { remove: unsubscribe }
  }

  // --- mutations (async; route to the transport, status streams back) ---

  /** Load (and, per the request, autoplay) media on the active session. */
  async loadMedia(request: MediaLoadRequest): Promise<void> {
    this.assertActive()
    return this.transport.loadMedia(request)
  }

  /**
   * Begin (or resume) playback of the current item.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async play(customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.play(customData)
  }

  /**
   * Pause playback of the current item.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async pause(customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.pause(customData)
  }

  /**
   * Stop playback and unload the current item (a loaded queue is removed).
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async stop(customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.stop(customData)
  }

  /** Seek within the current item (absolute/relative + resume state). */
  async seek(options: MediaSeekOptions): Promise<void> {
    this.assertActive()
    return this.transport.seek(options)
  }

  /**
   * Set the playback rate (1 = normal; GCK clamps the supported range).
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async setPlaybackRate(
    playbackRate: number,
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.setPlaybackRate(playbackRate, customData)
  }

  /**
   * Set the active media track ids (audio/text). Omit or pass an empty array to
   * clear the current set and fall back to the receiver defaults.
   */
  async setActiveTrackIds(trackIds: number[] = []): Promise<void> {
    this.assertActive()
    return this.transport.setActiveTrackIds(trackIds)
  }

  /**
   * Set the active media tracks.
   *
   * @deprecated v4-compat alias of {@link setActiveTrackIds} (kept because v4
   * shipped it, already deprecated, until the end of the 4.x line). GCK accepts
   * no `customData` for this request on either platform.
   */
  async setActiveMediaTracks(trackIds: number[] = []): Promise<void> {
    return this.setActiveTrackIds(trackIds)
  }

  /** Set the text-track (caption) style. */
  async setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void> {
    this.assertActive()
    return this.transport.setTextTrackStyle(textTrackStyle)
  }

  /**
   * Set the stream volume of the active session (0…1).
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async setStreamVolume(volume: number, customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.setStreamVolume(volume, customData)
  }

  /**
   * Mute/unmute the active session's stream.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async setStreamMuted(muted: boolean, customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.setStreamMuted(muted, customData)
  }

  /**
   * Replace the queue with `items`, starting at `startIndex`, in `repeatMode`.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueLoad(
    items: MediaQueueItem[],
    startIndex = 0,
    repeatMode: MediaRepeatMode = 'off',
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueLoad(items, startIndex, repeatMode, customData)
  }

  /**
   * Insert `items` before `beforeItemId`. A `beforeItemId` of `0` (GCK's
   * invalid-item sentinel, the default) appends to the end of the queue.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId = 0,
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueInsertItems(items, beforeItemId, customData)
  }

  /**
   * Insert a single `item` before `beforeItemId` (`0`, the default, appends).
   * A v4-compat convenience over {@link queueInsertItems}.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueInsertItem(
    item: MediaQueueItem,
    beforeItemId = 0,
    customData?: AnyMap
  ): Promise<void> {
    return this.queueInsertItems([item], beforeItemId, customData)
  }

  /**
   * Insert a single `item` before `beforeItemId` (`0`, the default, appends)
   * and make it the current item — one atomic GCK request (the receiver
   * assigns the new item's id, so this is *not* expressible as
   * `queueInsertItems` + `queueJumpToItem` without a racy status round-trip).
   *
   * @param playPosition Initial playback position in seconds for the item's
   * *first* play. Ignored on repeats/re-jumps (the item's `startTime` governs).
   * Omit to start from the item's `startTime`.
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueInsertAndPlayItem(
    item: MediaQueueItem,
    beforeItemId = 0,
    playPosition?: number,
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueInsertAndPlayItem(
      item,
      beforeItemId,
      playPosition,
      customData
    )
  }

  /**
   * Move `itemIds` to before `beforeItemId` (`0` = move-to-end, the default).
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueReorderItems(
    itemIds: number[],
    beforeItemId = 0,
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueReorderItems(itemIds, beforeItemId, customData)
  }

  /**
   * Remove `itemIds` from the queue.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueRemoveItems(
    itemIds: number[],
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueRemoveItems(itemIds, customData)
  }

  /**
   * Advance to the next queue item.
   *
   * @param customData Custom application-specific data to pass along with the
   * request. Android only — GCK iOS has no `customData` variant, so iOS
   * ignores it (same asymmetry v4 documented).
   */
  async queueNext(customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.queueNext(customData)
  }

  /**
   * Go back to the previous queue item.
   *
   * @param customData Custom application-specific data to pass along with the
   * request. Android only — GCK iOS has no `customData` variant, so iOS
   * ignores it (same asymmetry v4 documented).
   */
  async queuePrev(customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.queuePrev(customData)
  }

  /**
   * Jump to a specific queue item by id.
   *
   * @param customData Custom application-specific data to pass along with the request.
   */
  async queueJumpToItem(itemId: number, customData?: AnyMap): Promise<void> {
    this.assertActive()
    return this.transport.queueJumpToItem(itemId, customData)
  }

  /**
   * Set the queue repeat mode.
   *
   * @param customData Custom application-specific data to pass along with the
   * request. Android only — GCK iOS has no `customData` variant, so iOS
   * ignores it.
   */
  async queueSetRepeatMode(
    repeatMode: MediaRepeatMode,
    customData?: AnyMap
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueSetRepeatMode(repeatMode, customData)
  }

  /**
   * Request a fresh media status from the receiver. Resolves once the request
   * settles; the new status arrives via the store (and so the `useMediaStatus`
   * hook), not the return value. (v4 name: `requestStatus`.)
   */
  async requestStatus(): Promise<void> {
    this.assertActive()
    return this.transport.requestMediaStatus()
  }
}
