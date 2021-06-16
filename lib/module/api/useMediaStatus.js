import { useEffect, useState } from 'react';
import useRemoteMediaClient from './useRemoteMediaClient';
/**
 * Hook to retrieve current media status.
 *
 * Note that the media status is only updated when the status of the stream changes. Therefore, `mediaStatus.streamPosition` only reflects the time of the last status update.
 * If you need to know the current progress in near real-time, see `useStreamPosition` instead.
 *
 * @returns current media status, or `null` if there's no current media
 */

export default function useMediaStatus() {
  const client = useRemoteMediaClient();
  const [mediaStatus, setMediaStatus] = useState(null);
  useEffect(() => {
    if (!client) {
      setMediaStatus(null);
      return;
    }

    client.getMediaStatus().then(setMediaStatus);
    const subscription = client.onMediaStatusUpdated(setMediaStatus);
    return () => {
      subscription.remove();
    };
  }, [client]);
  return mediaStatus;
}
//# sourceMappingURL=useMediaStatus.js.map