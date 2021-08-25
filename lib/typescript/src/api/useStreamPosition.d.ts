/**
 * Hook to retrieve current stream position.
 *
 * @param {number} [interval] update interval (defaults to 1 second)
 * @returns current position in seconds, or `null` if there's no current media
 */
export default function useStreamPosition(interval?: number): number | null;
