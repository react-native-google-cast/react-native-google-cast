import { castTransport } from '../transport/CastTransport'
import { CastStore } from './CastStore'

/**
 * The permanent process-wide store singleton, wired to the real native
 * transport. Imported only by the façade layer (and ultimately the app at
 * runtime) — never by the store's own jest tests, which construct a `CastStore`
 * with a `FakeCastTransport` directly, so this module's native Nitro import
 * stays out of the test path.
 *
 * One `dispose()` exists on the store for Fast Refresh / runtime teardown.
 */
export const castStore = new CastStore(castTransport)

export { castTransport }
