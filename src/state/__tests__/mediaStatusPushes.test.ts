/**
 * Regression cover for "repeated media status pushes on one live session".
 *
 * Written while chasing v5-868 ("media status goes stale after the first
 * update"), which turned out **not to be a defect** — see the closed bead. The
 * Cast protocol pushes `MEDIA_STATUS` on transitions only; a receiver playing
 * steadily sends nothing, so a `streamPosition` that stops advancing is correct
 * behaviour and `useStreamPosition` is the API that extrapolates between
 * pushes. Confirmed on device 2026-08-03 with a boundary push counter
 * ({@link CastStore.getMediaPushCount}): pause → +1, play → +1,
 * `requestStatus()` → +2 with the position correctly advanced.
 *
 * The tests are kept because the property they pin is worth protecting on its
 * own: the store must apply EVERY push, not just the first. They were written
 * against a suspect that the device later exonerated, so on their own they
 * prove nothing about v5-868 — do not read a passing run here as evidence
 * about the native side, which they never touch.
 */
import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import type { MediaStatus } from '../../types/MediaStatus'
import { CastStore } from '../CastStore'
import { MEDIA_SLICE_KEY, type MediaState } from '../media.slice'

const device = (id: string): Device => ({
  capabilities: [],
  deviceId: id,
  deviceVersion: '1',
  friendlyName: `Device ${id}`,
  icons: [],
  ipAddress: '0.0.0.0',
  modelName: 'TestCast',
})

const session = (id: string): SessionInfo => ({
  sessionId: id,
  device: device(id),
})

const status = (streamPosition: number): MediaStatus => ({
  streamPosition,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  queueItems: [],
})

const mediaState = (store: CastStore) =>
  store.getSliceState<MediaState>(MEDIA_SLICE_KEY)

describe('repeated media status pushes on one live session', () => {
  it('applies EVERY status push, not just the first', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready

    transport.emitLifecycle({ type: 'started', session: session('s1') })

    // Mirrors the device sequence: load → pause → play → seek.
    transport.emitMediaStatus(status(10))
    expect(mediaState(store).currentStatus?.streamPosition).toBe(10)

    transport.emitMediaStatus(status(20))
    expect(mediaState(store).currentStatus?.streamPosition).toBe(20)

    transport.emitMediaStatus(status(30))
    expect(mediaState(store).currentStatus?.streamPosition).toBe(30)

    transport.emitMediaStatus(status(40))
    expect(mediaState(store).currentStatus?.streamPosition).toBe(40)
  })

  it('notifies subscribers on every status push', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready

    transport.emitLifecycle({ type: 'started', session: session('s1') })

    let notifications = 0
    const unsubscribe = store.subscribe(() => {
      notifications += 1
    })

    transport.emitMediaStatus(status(10))
    transport.emitMediaStatus(status(20))
    transport.emitMediaStatus(status(30))

    unsubscribe()
    // Three distinct statuses must produce three notifications — a frozen UI
    // with a correct store would show up here as a shortfall.
    expect(notifications).toBe(3)
  })

  it('counts every push at the boundary, before the live gate', async () => {
    const transport = new FakeCastTransport()
    const store = new CastStore(transport)
    await store.ready

    expect(store.getMediaPushCount()).toBe(0)

    // No session yet: the media slice drops these, but the counter must still
    // see them — that gap is precisely what makes it able to tell "native
    // stopped calling" apart from "the reducer dropped it" on a device.
    transport.emitMediaStatus(status(1))
    transport.emitMediaStatus(status(2))
    expect(store.getMediaPushCount()).toBe(2)
    expect(mediaState(store).currentStatus).toBeNull()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status(3))
    expect(store.getMediaPushCount()).toBe(3)
    expect(mediaState(store).currentStatus?.streamPosition).toBe(3)
  })
})
