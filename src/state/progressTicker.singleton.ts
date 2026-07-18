import { castStore, castTransport } from './castStore.singleton'
import { ProgressTicker } from './progressTicker'

/**
 * The process-wide progress ticker, bound to the {@link castStore} singleton.
 * Imported only by the façade layer (`useStreamPosition`,
 * `RemoteMediaClient.onMediaProgressUpdated`) — never by the ticker's own tests,
 * which construct a {@link ProgressTicker} over a `FakeCastTransport`-backed
 * store so this module's native import stays out of their path.
 *
 * The third argument is the ticker's only transport dependency: a one-shot
 * fresh-status request fired when the first progress subscriber attaches, so a
 * re-subscribe after an idle gap re-times the anchor off a live push (the
 * ticker swallows the no-session rejection). `undefined` keeps the default
 * monotonic clock.
 */
export const progressTicker = new ProgressTicker(castStore, undefined, () =>
  castTransport.requestMediaStatus()
)
