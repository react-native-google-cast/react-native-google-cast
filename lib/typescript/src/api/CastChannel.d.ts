import CastSession from './CastSession';
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
    castSession: CastSession;
    private messageListener;
    /** A custom channel identifier starting with `urn:x-cast:`. */
    namespace: string;
    private constructor();
    /**
     * Add a custom channel to a connected session. This method is equivalent to {@link CastSession#addChannel}.
     *
     * @param castSession connected session
     * @param namespace A custom channel identifier starting with `urn:x-cast:`, for example `urn:x-cast:com.reactnative.googlecast.example`. The namespace name is arbitrary; just make sure it's unique.
     * @param onMessage function to be invoked when we receive a message from the connected Cast receiver.
     */
    static add(castSession: CastSession, namespace: string, onMessage?: (message: Record<string, any> | string) => void): Promise<CastChannel>;
    /**
     * Register a message listener. If one already exists, it will be replaced.
     *
     * @param listener function to be invoked when we receive a message from the connected Cast receiver.
     */
    onMessage(listener: (message: Record<string, any> | string) => void): void;
    /**
     * Unregister a message listener.
     */
    offMessage(): void;
    /**
     * Remove the channel when it's no longer needed.
     * By calling this method, the underlying channel will be destroyed.
     */
    remove(): Promise<void>;
    /**
     * Send a message to the connected Cast receiver using this channel. Note that by default you need to send the message as a JSON object, unless you've initialized the namespace on the receiver to be of the string type.
     *
     * To listen for responses, register an {#onMessage} listener.
     */
    sendMessage(message: Record<string, any> | string): Promise<void>;
}
