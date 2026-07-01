import { useEffect, useState } from 'react'
import { progressTicker } from '../state/progressTicker.singleton'

/**
 * Hook returning the current stream position in seconds, ticking locally between
 * receiver status pushes while playback is `playing`. Returns `null` when there
 * is no active media.
 *
 * @param interval update interval in seconds (default `1`). Multiple subscribers
 *   with differing intervals share a single timer at the smallest interval.
 * @returns the current position in seconds, or `null`.
 */
export function useStreamPosition(interval = 1): number | null {
  const [position, setPosition] = useState<number | null>(() =>
    progressTicker.getPosition()
  )
  useEffect(() => {
    const update = () => setPosition(progressTicker.getPosition())
    update()
    return progressTicker.subscribe(update, interval)
  }, [interval])
  return position
}
