import { useEffect, useState } from 'react'
import CastChannel from './CastChannel'
import useCastSession from './useCastSession'

/**
 * Hook that provides the current {@link CastChannel} (may be `null`).
 *
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
export default function useCastChannel(
  namespace: string,
  onMessage?: (message: Record<string, any> | string) => void
): CastChannel | null {
  const [castChannel, setCastChannel] = useState<CastChannel | null>(null)
  const castSession = useCastSession()

  useEffect(() => {
    let channel: CastChannel | null

    if (castSession) {
      CastChannel.add(castSession, namespace).then((c) => {
        channel = c
        setCastChannel(c)
      })
    } else {
      channel = null
      setCastChannel(null)
    }

    return () => {
      channel?.remove()
    }
  }, [castSession, namespace])

  useEffect(() => {
    if (!onMessage) return // don't call offMessage when removing the effect

    castChannel?.onMessage(onMessage)

    return () => {
      castChannel?.offMessage()
    }
  }, [castChannel, onMessage])

  return castChannel
}
