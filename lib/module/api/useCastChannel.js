import { useEffect, useState } from 'react';
import CastChannel from './CastChannel';
import useCastSession from './useCastSession';
/**
 * Hook that establishes a custom {@link CastChannel} on the current connected session.
 *
 * @param namespace custom namespace starting with `urn:x-cast:`
 * @param onMessage listener called when a message from the receiver was received
 * @returns custom channel, or `null` if there's no session connected
 * @example
 * ```js
 * import { useCastChannel } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const castChannel = useCastChannel(
 *     'urn:x-cast:com.example.custom',
 *     useCallback(message => { console.log('Received message', message) }, [])
 *   )
 *
 *   // later, for example after pressing a button
 *   function onPress() {
 *     if (castChannel) {
 *       castChannel.sendMessage('...')
 *     }
 *   }
 * }
 * ```
 */

export default function useCastChannel(namespace, onMessage) {
  const [castChannel, setCastChannel] = useState(null);
  const castSession = useCastSession();
  useEffect(() => {
    let channel;

    if (castSession) {
      CastChannel.add(castSession, namespace).then(c => {
        channel = c;
        setCastChannel(c);
      });
    } else {
      channel = null;
      setCastChannel(null);
    }

    return () => {
      var _channel;

      (_channel = channel) === null || _channel === void 0 ? void 0 : _channel.remove();
    };
  }, [castSession, namespace]);
  useEffect(() => {
    if (!onMessage) return; // don't call offMessage when removing the effect

    castChannel === null || castChannel === void 0 ? void 0 : castChannel.onMessage(onMessage);
    return () => {
      castChannel === null || castChannel === void 0 ? void 0 : castChannel.offMessage();
    };
  }, [castChannel, onMessage]);
  return castChannel;
}
//# sourceMappingURL=useCastChannel.js.map