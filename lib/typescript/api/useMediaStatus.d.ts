import MediaStatus from '../types/MediaStatus';
/**
 * Hook to retrieve current media status.
 *
 * Note that the media status is only updated when the status of the stream changes. Therefore, `mediaStatus.streamPosition` only reflects the time of the last status update.
 * If you need to know the current progress in near real-time, see `useStreamPosition` instead.
 *
 * @returns current media status, or `null` if there's no current media
 */
export default function useMediaStatus(): MediaStatus | null;
