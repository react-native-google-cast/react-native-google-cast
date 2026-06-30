import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { Device, SessionInfo } from '../../transport/types'
import type { MediaStatus } from '../../types/MediaStatus'
import { CastStore } from '../CastStore'
import { MEDIA_SLICE_KEY, MediaState } from '../media.slice'

function device(id: string): Device {
  return {
    capabilities: [],
    deviceId: id,
    deviceVersion: '1',
    friendlyName: `Device ${id}`,
    icons: [],
    ipAddress: '0.0.0.0',
    modelName: 'TestCast',
  }
}

function session(id: string): SessionInfo {
  return { sessionId: id, device: device(id) }
}

function status(streamPosition: number): MediaStatus {
  return {
    streamPosition,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    queueItems: [],
  }
}

async function makeStore(): Promise<{
  store: CastStore
  transport: FakeCastTransport
}> {
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  await store.ready
  return { store, transport }
}

const mediaState = (store: CastStore): MediaState =>
  store.getSliceState<MediaState>(MEDIA_SLICE_KEY)

describe('media slice', () => {
  it('seeds an empty status (no media before a session loads any)', async () => {
    const { store } = await makeStore()
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('caches the latest pushed media status while a session is live', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })

    transport.emitMediaStatus(status(0))
    expect(mediaState(store).currentStatus).toMatchObject({ streamPosition: 0 })

    transport.emitMediaStatus(status(42))
    expect(mediaState(store).currentStatus).toMatchObject({
      streamPosition: 42,
    })
  })

  it('drops a status push when no session is live', async () => {
    const { store, transport } = await makeStore()

    // No session has started: a stray push must not populate the slice.
    transport.emitMediaStatus(status(0))
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('accepts a push when a session was already live at cold start', async () => {
    // Already-casting at init: the seed is live, so the first status sticks.
    const transport = new FakeCastTransport({
      initialSnapshot: { currentSession: session('s1') },
    })
    const store = new CastStore(transport)
    await store.ready

    transport.emitMediaStatus(status(5))
    expect(mediaState(store).currentStatus).toMatchObject({ streamPosition: 5 })
  })

  it('notifies subscribers when media status changes', async () => {
    const { store, transport } = await makeStore()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const listener = jest.fn()
    store.subscribe(listener)

    transport.emitMediaStatus(status(10))
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('clears a prior status when a new session replaces the live one', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status(7))
    expect(mediaState(store).currentStatus).not.toBeNull()

    // A replacement session starts: the previous session's media must not bleed
    // into the new generation, even before the receiver pushes a fresh status.
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('clears the status when the session ends (no use-after-free)', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status(7))
    expect(mediaState(store).currentStatus).not.toBeNull()

    transport.emitLifecycle({ type: 'ended' })
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('never retains a status across a failed session start', async () => {
    const { store, transport } = await makeStore()

    // No session ever became live, so a status arriving during the attempt is
    // dropped, and startFailed leaves the slice empty.
    transport.emitMediaStatus(status(7))
    transport.emitLifecycle({
      type: 'startFailed',
      error: { code: 'network', message: 'boom' },
    })
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('clears the status and drops later pushes when a session is suspended', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status(7))
    expect(mediaState(store).currentStatus).not.toBeNull()

    transport.emitLifecycle({ type: 'suspended', reason: 'appBackgrounded' })
    expect(mediaState(store).currentStatus).toBeNull()

    // A status racing in after the suspend (Android background path) must not
    // resurrect media now that the session is gone.
    transport.emitMediaStatus(status(99))
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('clears the status and drops later pushes when a resume fails', async () => {
    const { store, transport } = await makeStore()

    transport.emitLifecycle({ type: 'started', session: session('s1') })
    transport.emitMediaStatus(status(7))
    transport.emitLifecycle({ type: 'suspended' })
    transport.emitLifecycle({
      type: 'resumeFailed',
      error: { code: 'timeout', message: 'gone' },
    })
    expect(mediaState(store).currentStatus).toBeNull()

    // Still no live session after the failed resume: a late push stays dropped.
    transport.emitMediaStatus(status(99))
    expect(mediaState(store).currentStatus).toBeNull()
  })

  it('keeps a stable reference on unrelated events (Invariant 2)', async () => {
    const { store, transport } = await makeStore()

    const before = mediaState(store)
    transport.emitState('connecting')
    transport.emitDevices([device('a')])
    expect(mediaState(store)).toBe(before)

    // A clear on an already-empty slice must not allocate either — for any
    // teardown event, not just `ended`.
    transport.emitLifecycle({ type: 'ended' })
    transport.emitLifecycle({ type: 'suspended' })
    transport.emitLifecycle({ type: 'resumeFailed', error: { code: 'network' } })
    expect(mediaState(store)).toBe(before)
  })
})

describe('FakeCastTransport — media mutation recording', () => {
  it('records every media mutation in call order with its args', async () => {
    const transport = new FakeCastTransport()
    await transport.initAndSubscribe(
      () => {},
      () => {},
      () => {},
      () => {}
    )

    await transport.play()
    await transport.seek({ position: 30 })
    await transport.setStreamVolume(0.5)
    await transport.queueJumpToItem(3)

    expect(transport.mediaCalls).toEqual([
      { method: 'play', args: [] },
      { method: 'seek', args: [{ position: 30 }] },
      { method: 'setStreamVolume', args: [0.5] },
      { method: 'queueJumpToItem', args: [3] },
    ])
  })

  it('runs scripted behaviour so a mutation can reject', async () => {
    const transport = new FakeCastTransport()
    transport.mediaBehavior.pause = async () => {
      throw { code: 'noSession', message: 'gone' }
    }

    await expect(transport.pause()).rejects.toMatchObject({ code: 'noSession' })
  })
})
