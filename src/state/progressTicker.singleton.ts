import { castStore } from './castStore.singleton'
import { ProgressTicker } from './progressTicker'

/**
 * The process-wide progress ticker, bound to the {@link castStore} singleton.
 * Imported only by the façade layer (`useStreamPosition`,
 * `RemoteMediaClient.onMediaProgressUpdated`) — never by the ticker's own tests,
 * which construct a {@link ProgressTicker} over a `FakeCastTransport`-backed
 * store so this module's native import stays out of their path.
 */
export const progressTicker = new ProgressTicker(castStore)
