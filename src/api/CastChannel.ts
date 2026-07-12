import type { CastError, CastTransportApi } from '../transport/types'
import type { CastStore } from '../state/CastStore'
import {
  CHANNEL_SLICE_KEY,
  type ChannelState,
  type ChannelStatus,
} from '../state/channel.slice'

/** Custom channel namespaces must start with this prefix (v4 parity). */
export const CAST_NAMESPACE_PREFIX = 'urn:x-cast:'
/** GCK's own media namespace — reserved, cannot be registered (v4 parity). */
export const RESERVED_MEDIA_NAMESPACE = 'urn:x-cast:com.google.cast.media'

/**
 * A channel for sending custom messages between this sender and the Cast
 * receiver, created via {@link CastSession.addChannel} (or the
 * {@link useCastChannel} hook). Use when you've built a custom receiver and
 * want to communicate with it.
 *
 * Like {@link CastSession}, a channel is **generation-bound** (Invariant 3): it
 * belongs to the session that was live when it was added. Channels are
 * auto-removed natively when the session ends, so once that session is gone
 * this handle is stale — `sendMessage`/`remove` reject `noSession` before
 * crossing the bridge, `connected`/`writable` read `undefined`, and a retained
 * message listener can never receive a later session's messages (even if the
 * same namespace is re-registered).
 *
 * `onMessage` holds a **single listener, replace-on-set** (v4 semantics): a
 * channel is a pipe, not a broadcast. Messages are always delivered as the raw
 * string received — call `JSON.parse` yourself if your receiver sends JSON.
 *
 * @see [Custom Channels](../../guides/custom-channels)
 */
export class CastChannel {
  /** The channel's custom namespace (starts with `urn:x-cast:`). */
  readonly namespace: string

  private readonly store: CastStore
  private readonly transport: CastTransportApi
  private readonly generation: number
  private offMessageFn: (() => void) | null = null

  /** @internal Created by {@link CastSession.addChannel} — do not construct directly. */
  constructor(
    store: CastStore,
    transport: CastTransportApi,
    namespace: string,
    generation: number
  ) {
    this.store = store
    this.transport = transport
    this.namespace = namespace
    this.generation = generation
  }

  /** Whether this channel still belongs to the current live session. */
  get isActive(): boolean {
    return this.store.getCurrentGeneration() === this.generation
  }

  /**
   * Whether this channel is currently connected, or `undefined` when the
   * channel (or its session) is gone. iOS reports live values — often `false`
   * right after {@link CastSession.addChannel} (the connection completes
   * asynchronously); Android always reports `true` (register-once, v4 parity).
   *
   * A point-in-time read of the store cache, not a reactive value: a component
   * rendering it does not re-render when the status changes (v4 parity).
   */
  get connected(): boolean | undefined {
    return this.status()?.connected
  }

  /** Whether this channel is currently writable (same platform note as `connected`). */
  get writable(): boolean | undefined {
    return this.status()?.writable
  }

  private status(): ChannelStatus | undefined {
    if (!this.isActive) return undefined
    return this.store.getSliceState<ChannelState>(CHANNEL_SLICE_KEY).statuses[
      this.namespace
    ]
  }

  private assertActive(): void {
    if (!this.isActive) {
      const error: CastError = {
        code: 'noSession',
        message: 'This Cast channel’s session has ended.',
      }
      throw error
    }
  }

  /**
   * Send a message to the connected Cast receiver on this channel. Objects are
   * `JSON.stringify`ed (v4 parity); strings pass through unchanged. Note that
   * by default a custom web receiver parses messages as JSON — send objects
   * unless you've configured the namespace as `STRING`.
   *
   * Settles when the platform accepts/rejects the send (v4 fire-and-forgot on
   * Android); rejects a typed {@link CastError} (`noSession` once stale).
   */
  async sendMessage(message: object | string): Promise<void> {
    this.assertActive()
    return this.transport.sendMessage(
      this.namespace,
      typeof message === 'string' ? message : JSON.stringify(message)
    )
  }

  /**
   * Register the message listener, **replacing** any previous one (v4 parity —
   * a channel holds at most one listener; see the listener-ownership note in
   * the guide). The subscription is liveness-scoped: once this channel is
   * stale it stops delivering and drops itself.
   */
  onMessage(listener: (message: string) => void): void {
    this.offMessage()
    if (!this.isActive) return
    this.offMessageFn = this.store.onChannelMessage(
      this.namespace,
      (message) => {
        // Stale (session changed): drop the subscription instead of delivering
        // a later session's message for a re-registered namespace.
        if (!this.isActive) {
          this.offMessage()
          return
        }
        listener(message)
      }
    )
  }

  /** Unregister the message listener. */
  offMessage(): void {
    this.offMessageFn?.()
    this.offMessageFn = null
  }

  /**
   * Remove the channel when it's no longer needed; the namespace becomes
   * registrable again. (Channels are also auto-removed when the session ends.)
   */
  async remove(): Promise<void> {
    this.assertActive()
    this.offMessage()
    // Free the namespace SYNCHRONOUSLY, before the bridge call (T1): an
    // immediate re-add (e.g. a `useCastChannel` remount) must pass the
    // register-once check without awaiting the removal. Ordering stays safe on
    // both sides — the native main-thread queue processes this removeChannel
    // before any subsequently-issued addChannel. (`removeChannel` is idempotent
    // and effectively infallible, so the optimistic free cannot strand state;
    // a teardown clears the slice wholesale anyway.)
    this.store.dispatch({ kind: 'channelRemoved', namespace: this.namespace })
    await this.transport.removeChannel(this.namespace)
  }
}
