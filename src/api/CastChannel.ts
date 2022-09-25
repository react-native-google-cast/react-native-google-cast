import {
  EventSubscription,
  NativeEventEmitter,
  NativeModules,
} from 'react-native'

const { RNGCCastSession: Native } = NativeModules

/**
 * A channel for sending custom messages between this sender and the Cast receiver. Use when you've built a custom receiver and want to communicate with it.
 *
 * @see [Custom Channels](../../guides/custom-channels)
 *
 * @example
 * ```js
 * import { CastChannel } from 'react-native-google-cast'
 *
 * const channel = await castSession.addChannel('urn:x-cast:com.example.custom')
 *
 * channel.sendMessage('...')
 * ```
 */
export default class CastChannel {
  private channelListener: EventSubscription | undefined
  private messageListener: EventSubscription | undefined

  /** A flag indicating whether this channel is currently connected. */
  connected?: boolean

  /** A custom channel identifier starting with `urn:x-cast:`. */
  namespace: string

  /** A flag indicating whether this channel is currently writable. */
  writable?: boolean

  private constructor(
    data: CastChannel,
    onMessage?: (message: Record<string, any> | string) => void
  ) {
    this.connected = data.connected
    this.namespace = data.namespace
    this.writable = data.writable

    if (onMessage) this.onMessage(onMessage)
    this.onUpdate()
  }

  /**
   * Add a custom channel to a connected session. This method is equivalent to {@link CastSession#addChannel}.
   *
   * @param namespace A custom channel identifier starting with `urn:x-cast:`, for example `urn:x-cast:com.reactnative.googlecast.example`. The namespace name is arbitrary; just make sure it's unique.
   * @param onMessage function to be invoked when we receive a message from the connected Cast receiver.
   */
  public static async add(
    namespace: string,
    onMessage?: (message: Record<string, any> | string) => void
  ): Promise<CastChannel> {
    if (namespace === 'urn:x-cast:com.google.cast.media')
      throw new Error(
        'The namespace "urn:x-cast:com.google.cast.media" is reserved. Please use a different name.'
      )

    const channel = await Native.addChannel(namespace)

    if (!channel.connected) {
      console.warn(
        `Channel ${namespace} not connected. Make sure a session is established and you've set a listener in your custom receiver https://developers.google.com/cast/docs/web_receiver/core_features#custom_messages`
      )
    }

    return new CastChannel(channel, onMessage)
  }

  /**
   * Register a message listener. If one already exists, it will be replaced.
   *
   * @param listener function to be invoked when we receive a message from the connected Cast receiver.
   */
  onMessage(listener: (message: Record<string, any> | string) => void) {
    this.offMessage()
    const eventEmitter = new NativeEventEmitter(Native)
    this.messageListener = eventEmitter.addListener(
      Native.CHANNEL_MESSAGE_RECEIVED,
      ({ namespace, message }) => {
        this.namespace === namespace && listener(message)
      }
    )
  }

  /**
   * Unregister a message listener.
   */
  offMessage(): void {
    this.messageListener?.remove()
    this.messageListener = undefined
  }

  private onUpdate() {
    const eventEmitter = new NativeEventEmitter(Native)
    this.channelListener = eventEmitter.addListener(
      Native.CHANNEL_UPDATED,
      (ch) => {
        if (this.namespace !== ch.namespace) return
        this.connected = ch.connected
        this.writable = ch.writable
      }
    )
  }

  private offUpdate() {
    this.channelListener?.remove()
    this.channelListener = undefined
  }

  /**
   * Remove the channel when it's no longer needed.
   * By calling this method, the underlying channel will be destroyed.
   */
  remove(): Promise<void> {
    this.offMessage()
    this.offUpdate()
    return Native.removeChannel(this.namespace)
  }

  /**
   * Send a message to the connected Cast receiver using this channel. Note that by default you need to send the message as a JSON object, unless you've initialized the namespace on the receiver to be of the string type.
   *
   * To listen for responses, register an {#onMessage} listener.
   */
  sendMessage(message: Record<string, any> | string): Promise<void> {
    return Native.sendMessage(
      this.namespace,
      typeof message === 'string' ? message : JSON.stringify(message)
    )
  }
}
