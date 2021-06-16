function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { NativeEventEmitter, NativeModules } from 'react-native';
const {
  RNGCCastSession: Native
} = NativeModules;
const EventEmitter = new NativeEventEmitter(Native);
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
  /** A custom channel identifier starting with `urn:x-cast:`. */
  constructor(castSession, namespace, onMessage) {
    _defineProperty(this, "castSession", void 0);

    _defineProperty(this, "messageListener", void 0);

    _defineProperty(this, "namespace", void 0);

    this.castSession = castSession;
    this.namespace = namespace;

    if (onMessage) {
      this.onMessage(onMessage);
    }
  }
  /**
   * Add a custom channel to a connected session. This method is equivalent to {@link CastSession#addChannel}.
   *
   * @param castSession connected session
   * @param namespace A custom channel identifier starting with `urn:x-cast:`, for example `urn:x-cast:com.reactnative.googlecast.example`. The namespace name is arbitrary; just make sure it's unique.
   * @param onMessage function to be invoked when we receive a message from the connected Cast receiver.
   */


  static async add(castSession, namespace, onMessage) {
    await Native.addChannel(namespace);
    return new CastChannel(castSession, namespace, onMessage);
  }
  /**
   * Register a message listener. If one already exists, it will be replaced.
   *
   * @param listener function to be invoked when we receive a message from the connected Cast receiver.
   */


  onMessage(listener) {
    this.offMessage();
    this.messageListener = EventEmitter.addListener(Native.CHANNEL_MESSAGE_RECEIVED, ({
      namespace,
      message
    }) => {
      this.namespace === namespace && listener(message);
    });
  }
  /**
   * Unregister a message listener.
   */


  offMessage() {
    var _this$messageListener;

    (_this$messageListener = this.messageListener) === null || _this$messageListener === void 0 ? void 0 : _this$messageListener.remove();
    this.messageListener = undefined;
  }
  /**
   * Remove the channel when it's no longer needed.
   * By calling this method, the underlying channel will be destroyed.
   */


  remove() {
    this.offMessage();
    return Native.removeChannel(this.namespace);
  }
  /**
   * Send a message to the connected Cast receiver using this channel. Note that by default you need to send the message as a JSON object, unless you've initialized the namespace on the receiver to be of the string type.
   *
   * To listen for responses, register an {#onMessage} listener.
   */


  sendMessage(message) {
    return Native.sendMessage(this.namespace, typeof message === 'string' ? message : JSON.stringify(message));
  }

}
//# sourceMappingURL=CastChannel.js.map