import { useEffect, useState } from 'react'
import MediaQueue from './MediaQueue';

/**
 * Hook that provides the current {@link MediaQueue}.
 *
 * @returns current media queue, or `null` if there's no session connected
 * @example
 * ```js
 * import { useQueue } from 'react-native-google-cast'
 *
 * function MyComponent() {
 *   const queue = useQueue()
 *
 *   if (queue) {
 *     queue.getItemById(...)
 *   }
 * }
 * ```
 */
export default function useQueue() {
  const [queue, setQueue] = useState<MediaQueue | null>(null);
  useEffect(() => {
    MediaQueue.getState().then(state => setQueue(state)).catch(() => {});

    const changed = MediaQueue.onChanged(queue => setQueue(queue));
    return () => {
      changed.remove();
    };
  }, []);
  return queue;
}
