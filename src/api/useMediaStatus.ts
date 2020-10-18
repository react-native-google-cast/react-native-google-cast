import { useEffect, useState } from 'react'
import MediaStatus from '../types/MediaStatus'
import useRemoteMediaClient from './useRemoteMediaClient'

export default function useMediaStatus() {
  const client = useRemoteMediaClient()
  const [mediaStatus, setMediaStatus] = useState<MediaStatus | null>(null)

  useEffect(() => {
    if (!client) {
      setMediaStatus(null)
      return
    }

    client.getMediaStatus().then(setMediaStatus)

    const subscription = client.onMediaStatusUpdated(setMediaStatus)

    return () => {
      subscription.remove()
    }
  }, [client])

  return mediaStatus
}
