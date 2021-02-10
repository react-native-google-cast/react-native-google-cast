import { useEffect, useState } from 'react';
import useRemoteMediaClient from './useRemoteMediaClient';
/**
 * Hook to retrieve current stream position.
 *
 * @param {number} [interval] update interval (defaults to 1 second)
 * @returns current position in seconds, or `null` if there's no current media
 */

export default function useStreamPosition(interval) {
  const client = useRemoteMediaClient();
  const [streamPosition, setStreamPosition] = useState(null);
  useEffect(() => {
    if (!client) {
      setStreamPosition(null);
      return;
    }

    client.getStreamPosition().then(setStreamPosition);
    const subscription = client.onMediaProgressUpdated(setStreamPosition, interval);
    return () => {
      subscription.remove();
    };
  }, [client, interval]);
  return streamPosition;
}
//# sourceMappingURL=useStreamPosition.js.map