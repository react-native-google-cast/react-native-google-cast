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

  /** Begin (or resume) playback of the current item. */
  async play(): Promise<void> {
    this.assertActive()
    return this.transport.play()
  }

  /** Pause playback of the current item. */
  async pause(): Promise<void> {
    this.assertActive()
    return this.transport.pause()
  }

  /** Stop playback and unload the current item (a loaded queue is removed). */
  async stop(): Promise<void> {
    this.assertActive()
    return this.transport.stop()
  }

  /** Seek within the current item (absolute/relative + resume state). */
  async seek(options: MediaSeekOptions): Promise<void> {
    this.assertActive()
    return this.transport.seek(options)
  }

  /** Set the playback rate (1 = normal; GCK clamps the supported range). */
  async setPlaybackRate(playbackRate: number): Promise<void> {
    this.assertActive()
    return this.transport.setPlaybackRate(playbackRate)
  }

  /**
   * Set the active media track ids (audio/text). Omit or pass an empty array to
   * clear the current set and fall back to the receiver defaults.
   */
  async setActiveTrackIds(trackIds: number[] = []): Promise<void> {
    this.assertActive()
    return this.transport.setActiveTrackIds(trackIds)
  }

  /** Set the text-track (caption) style. */
  async setTextTrackStyle(textTrackStyle: TextTrackStyle): Promise<void> {
    this.assertActive()
    return this.transport.setTextTrackStyle(textTrackStyle)
  }

  /** Set the stream volume of the active session (0…1). */
  async setStreamVolume(volume: number): Promise<void> {
    this.assertActive()
    return this.transport.setStreamVolume(volume)
  }

  /** Mute/unmute the active session's stream. */
  async setStreamMuted(muted: boolean): Promise<void> {
    this.assertActive()
    return this.transport.setStreamMuted(muted)
  }

  /** Replace the queue with `items`, starting at `startIndex`, in `repeatMode`. */
  async queueLoad(
    items: MediaQueueItem[],
    startIndex = 0,
    repeatMode: MediaRepeatMode = 'off'
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueLoad(items, startIndex, repeatMode)
  }

  /**
   * Insert `items` before `beforeItemId`. A `beforeItemId` of `0` (GCK's
   * invalid-item sentinel, the default) appends to the end of the queue.
   */
  async queueInsertItems(
    items: MediaQueueItem[],
    beforeItemId = 0
  ): Promise<void> {
    this.assertActive()
    return this.transport.queueInsertItems(items, beforeItemId)
  }

  /** Move `itemIds` to before `beforeItemId` (`0` = move-to-end, the default). */
  async queueReorderItems(itemIds: number[], beforeItemId = 0): Promise<void> {
    this.assertActive()
    return this.transport.queueReorderItems(itemIds, beforeItemId)
  }

  /** Remove `itemIds` from the queue. */
  async queueRemoveItems(itemIds: number[]): Promise<void> {
    this.assertActive()
    return this.transport.queueRemoveItems(itemIds)
  }

  /** Advance to the next queue item. */
  async queueNext(): Promise<void> {
    this.assertActive()
    return this.transport.queueNext()
  }

  /** Go back to the previous queue item. */
  async queuePrev(): Promise<void> {
    this.assertActive()
    return this.transport.queuePrev()
  }

  /** Jump to a specific queue item by id. */
  async queueJumpToItem(itemId: number): Promise<void> {
    this.assertActive()
    return this.transport.queueJumpToItem(itemId)
  }

  /** Set the queue repeat mode. */
  async queueSetRepeatMode(repeatMode: MediaRepeatMode): Promise<void> {
    this.assertActive()
    return this.transport.queueSetRepeatMode(repeatMode)
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
