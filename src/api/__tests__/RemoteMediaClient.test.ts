import type { AnyMap } from 'react-native-nitro-modules'
import { FakeCastTransport } from '../../transport/__fakes__/FakeCastTransport'
import type { CastError, Device, SessionInfo } from '../../transport/types'
import type { MediaStatus } from '../../types/MediaStatus'
import type { MediaInfo } from '../../types/MediaInfo'
import type { MediaLoadRequest } from '../../types/MediaLoadRequest'
import type { MediaSeekOptions } from '../../types/MediaSeekOptions'
import type { MediaQueueItem } from '../../types/MediaQueueItem'
import type { TextTrackStyle } from '../../types/TextTrackStyle'
import { CastStore } from '../../state/CastStore'
import type { MediaState } from '../../state/media.slice'
import { castStore, castTransport } from '../../state/castStore.singleton'
import { RemoteMediaClient } from '../RemoteMediaClient'

// `RemoteMediaClient` now imports the singleton progress ticker, which
// transitively pulls in the native `CastTransport` (unloadable under jest).
// Swap the store singleton for a fake-backed one so the module — and every
// test in this file — loads. Mirrors `mediaHooks.test.ts`.
jest.mock('../../state/castStore.singleton', () => {
  const { CastStore: Store } = require('../../state/CastStore')
  const {
    FakeCastTransport: Transport,
  } = require('../../transport/__fakes__/FakeCastTransport')
  const transport = new Transport()
  const store = new Store(transport)
  return { castStore: store, castTransport: transport }
})

// The singleton ticker captures Date.now at module load — before
// jest.useFakeTimers() — so its clock can't be advanced by the test. Inject a
// controllable clock (a mock-prefixed name, permitted by jest's hoist plugin)
// bound to the SAME mocked castStore.singleton the progress test drives.
let mockNow = 0
jest.mock('../../state/progressTicker.singleton', () => {
  const { ProgressTicker } = require('../../state/progressTicker')
  const { castStore: store } = require('../../state/castStore.singleton')
  return { progressTicker: new ProgressTicker(store, () => mockNow) }
})

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
function mediaStatus(streamPosition = 0): MediaStatus {
  return {
    streamPosition,
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    queueItems: [],
  }
}

const mediaInfo: MediaInfo = { contentUrl: 'https://example.com/a.mp4' }
const loadRequest: MediaLoadRequest = { mediaInfo, autoplay: true }
const seekOptions: MediaSeekOptions = { position: 42 }
const textTrackStyle: TextTrackStyle = { fontScale: 1.2 }
const queueItems: MediaQueueItem[] = [{ mediaInfo }]

async function setup() {
  const transport = new FakeCastTransport()
  const store = new CastStore(transport)
  await store.ready
  return { transport, store }
}

/** A store with a single live session and its memoized client. */
async function withSession() {
  const { transport, store } = await setup()
  transport.emitLifecycle({ type: 'started', session: session('s1') })
  const client = RemoteMediaClient.current(store, transport)!
  return { transport, store, client }
}

describe('RemoteMediaClient — reads (served from the media slice)', () => {
  it('getMediaStatus is null until a status streams in', async () => {
    const { client } = await withSession()
    expect(client.getMediaStatus()).toBeNull()
  })

  it('getMediaStatus reflects the streamed status (same ref)', async () => {
    const { client, transport } = await withSession()
    const status = mediaStatus(10)
    transport.emitMediaStatus(status)
    expect(client.getMediaStatus()).toBe(status)
  })

  it('getStreamPosition reads the streamPosition, null when no status', async () => {
    const { client, transport } = await withSession()
    expect(client.getStreamPosition()).toBeNull()
    transport.emitMediaStatus(mediaStatus(33))
    expect(client.getStreamPosition()).toBe(33)
  })
})

describe('RemoteMediaClient — mutation routing', () => {
  const cases: Array<{
    name: string
    call: (c: RemoteMediaClient) => Promise<void>
    expected: { method: string; args: unknown[] }
  }> = [
    {
      name: 'loadMedia',
      call: (c) => c.loadMedia(loadRequest),
      expected: { method: 'loadMedia', args: [loadRequest] },
    },
    {
      name: 'play',
      call: (c) => c.play(),
      expected: { method: 'play', args: [] },
    },
    {
      name: 'pause',
      call: (c) => c.pause(),
      expected: { method: 'pause', args: [] },
    },
    {
      name: 'stop',
      call: (c) => c.stop(),
      expected: { method: 'stop', args: [] },
    },
    {
      name: 'seek',
      call: (c) => c.seek(seekOptions),
      expected: { method: 'seek', args: [seekOptions] },
    },
    {
      name: 'setPlaybackRate',
      call: (c) => c.setPlaybackRate(1.5),
      expected: { method: 'setPlaybackRate', args: [1.5] },
    },
    {
      name: 'setActiveTrackIds',
      call: (c) => c.setActiveTrackIds([1, 2]),
      expected: { method: 'setActiveTrackIds', args: [[1, 2]] },
    },
    {
      // v4-compat deprecated alias: routes through setActiveTrackIds.
      name: 'setActiveMediaTracks',
      call: (c) => c.setActiveMediaTracks([1, 2]),
      expected: { method: 'setActiveTrackIds', args: [[1, 2]] },
    },
    {
      name: 'setTextTrackStyle',
      call: (c) => c.setTextTrackStyle(textTrackStyle),
      expected: { method: 'setTextTrackStyle', args: [textTrackStyle] },
    },
    {
      name: 'setStreamVolume',
      call: (c) => c.setStreamVolume(0.4),
      expected: { method: 'setStreamVolume', args: [0.4] },
    },
    {
      name: 'setStreamMuted',
      call: (c) => c.setStreamMuted(true),
      expected: { method: 'setStreamMuted', args: [true] },
    },
    {
      name: 'queueLoad',
      call: (c) => c.queueLoad(queueItems, 1, 'all'),
      expected: { method: 'queueLoad', args: [queueItems, 1, 'all'] },
    },
    {
      name: 'queueInsertItems',
      call: (c) => c.queueInsertItems(queueItems, 7),
      expected: { method: 'queueInsertItems', args: [queueItems, 7] },
    },
    {
      // v4-compat sugar: routes through queueInsertItems with a 1-item array.
      name: 'queueInsertItem',
      call: (c) => c.queueInsertItem(queueItems[0]!, 7),
      expected: { method: 'queueInsertItems', args: [[queueItems[0]], 7] },
    },
    {
      name: 'queueInsertAndPlayItem',
      call: (c) => c.queueInsertAndPlayItem(queueItems[0]!, 7, 30),
      expected: {
        method: 'queueInsertAndPlayItem',
        args: [queueItems[0], 7, 30],
      },
    },
    {
      name: 'queueReorderItems',
      call: (c) => c.queueReorderItems([3, 4], 7),
      expected: { method: 'queueReorderItems', args: [[3, 4], 7] },
    },
    {
      name: 'queueRemoveItems',
      call: (c) => c.queueRemoveItems([3, 4]),
      expected: { method: 'queueRemoveItems', args: [[3, 4]] },
    },
    {
      name: 'queueNext',
      call: (c) => c.queueNext(),
      expected: { method: 'queueNext', args: [] },
    },
    {
      name: 'queuePrev',
      call: (c) => c.queuePrev(),
      expected: { method: 'queuePrev', args: [] },
    },
    {
      name: 'queueJumpToItem',
      call: (c) => c.queueJumpToItem(9),
      expected: { method: 'queueJumpToItem', args: [9] },
    },
    {
      name: 'queueSetRepeatMode',
      call: (c) => c.queueSetRepeatMode('single'),
      expected: { method: 'queueSetRepeatMode', args: ['single'] },
    },
    {
      name: 'requestStatus',
      call: (c) => c.requestStatus(),
      expected: { method: 'requestMediaStatus', args: [] },
    },
  ]

  it('covers every transport mutation (drift guard)', () => {
    // If T4a grows the surface, this list must grow too. 20 transport
    // mutations + 2 v4-compat façade sugars (queueInsertItem,
    // setActiveMediaTracks) = 22.
    expect(cases).toHaveLength(22)
  })

  it.each(cases)(
    'routes $name through the transport',
    async ({ call, expected }) => {
      const { client, transport } = await withSession()
      await call(client)
      expect(transport.mediaCalls).toEqual([expected])
    }
  )
})

describe('RemoteMediaClient — customData threading (v5-aug.5, v4 parity)', () => {
  const customData: AnyMap = { requestTag: 'cd-1' }
  const cases: Array<{
    name: string
    call: (c: RemoteMediaClient) => Promise<void>
    expected: { method: string; args: unknown[] }
  }> = [
    {
      name: 'play',
      call: (c) => c.play(customData),
      expected: { method: 'play', args: [customData] },
    },
    {
      name: 'pause',
      call: (c) => c.pause(customData),
      expected: { method: 'pause', args: [customData] },
    },
    {
      name: 'stop',
      call: (c) => c.stop(customData),
      expected: { method: 'stop', args: [customData] },
    },
    {
      name: 'setPlaybackRate',
      call: (c) => c.setPlaybackRate(1.5, customData),
      expected: { method: 'setPlaybackRate', args: [1.5, customData] },
    },
    {
      name: 'setStreamVolume',
      call: (c) => c.setStreamVolume(0.4, customData),
      expected: { method: 'setStreamVolume', args: [0.4, customData] },
    },
    {
      name: 'setStreamMuted',
      call: (c) => c.setStreamMuted(true, customData),
      expected: { method: 'setStreamMuted', args: [true, customData] },
    },
    {
      name: 'queueLoad',
      call: (c) => c.queueLoad(queueItems, 1, 'all', customData),
      expected: {
        method: 'queueLoad',
        args: [queueItems, 1, 'all', customData],
      },
    },
    {
      name: 'queueInsertItems',
      call: (c) => c.queueInsertItems(queueItems, 7, customData),
      expected: {
        method: 'queueInsertItems',
        args: [queueItems, 7, customData],
      },
    },
    {
      name: 'queueInsertItem',
      call: (c) => c.queueInsertItem(queueItems[0]!, 7, customData),
      expected: {
        method: 'queueInsertItems',
        args: [[queueItems[0]], 7, customData],
      },
    },
    {
      name: 'queueInsertAndPlayItem',
      call: (c) => c.queueInsertAndPlayItem(queueItems[0]!, 7, 30, customData),
      expected: {
        method: 'queueInsertAndPlayItem',
        args: [queueItems[0], 7, 30, customData],
      },
    },
    {
      name: 'queueReorderItems',
      call: (c) => c.queueReorderItems([3, 4], 7, customData),
      expected: { method: 'queueReorderItems', args: [[3, 4], 7, customData] },
    },
    {
      name: 'queueRemoveItems',
      call: (c) => c.queueRemoveItems([3, 4], customData),
      expected: { method: 'queueRemoveItems', args: [[3, 4], customData] },
    },
    {
      name: 'queueNext',
      call: (c) => c.queueNext(customData),
      expected: { method: 'queueNext', args: [customData] },
    },
    {
      name: 'queuePrev',
      call: (c) => c.queuePrev(customData),
      expected: { method: 'queuePrev', args: [customData] },
    },
    {
      name: 'queueJumpToItem',
      call: (c) => c.queueJumpToItem(9, customData),
      expected: { method: 'queueJumpToItem', args: [9, customData] },
    },
    {
      name: 'queueSetRepeatMode',
      call: (c) => c.queueSetRepeatMode('single', customData),
      expected: { method: 'queueSetRepeatMode', args: ['single', customData] },
    },
  ]

  it.each(cases)(
    'threads customData through $name',
    async ({ call, expected }) => {
      const { client, transport } = await withSession()
      await call(client)
      expect(transport.mediaCalls).toEqual([expected])
    }
  )

  it('seek carries customData inside its options object', async () => {
    const { client, transport } = await withSession()
    const options: MediaSeekOptions = { ...seekOptions, customData }
    await client.seek(options)
    expect(transport.mediaCalls).toEqual([{ method: 'seek', args: [options] }])
  })
})

describe('RemoteMediaClient — ergonomic defaults', () => {
  it('setActiveTrackIds defaults to an empty array (clear)', async () => {
    const { client, transport } = await withSession()
    await client.setActiveTrackIds()
    expect(transport.mediaCalls).toEqual([
      { method: 'setActiveTrackIds', args: [[]] },
    ])
  })

  it('queueInsertItems / queueReorderItems default beforeItemId to 0 (append)', async () => {
    const { client, transport } = await withSession()
    await client.queueInsertItems(queueItems)
    await client.queueReorderItems([1])
    expect(transport.mediaCalls).toEqual([
      { method: 'queueInsertItems', args: [queueItems, 0] },
      { method: 'queueReorderItems', args: [[1], 0] },
    ])
  })

  it('queueLoad defaults startIndex to 0 and repeatMode to off', async () => {
    const { client, transport } = await withSession()
    await client.queueLoad(queueItems)
    expect(transport.mediaCalls).toEqual([
      { method: 'queueLoad', args: [queueItems, 0, 'off'] },
    ])
  })

  it('queueInsertItem / queueInsertAndPlayItem default beforeItemId to 0 (append)', async () => {
    const { client, transport } = await withSession()
    await client.queueInsertItem(queueItems[0]!)
    await client.queueInsertAndPlayItem(queueItems[0]!)
    expect(transport.mediaCalls).toEqual([
      { method: 'queueInsertItems', args: [[queueItems[0]], 0] },
      // playPosition omitted → not recorded → the item's startTime governs.
      { method: 'queueInsertAndPlayItem', args: [queueItems[0], 0] },
    ])
  })

  it('normalizes a v4-style null beforeItemId to the 0 append sentinel', async () => {
    // v4 typed beforeItemId as `number | null` and did `beforeItemId || 0`;
    // drop-in callers like queueInsertItem(item, null, customData) must not
    // leak `null` into the (strictly numeric) bridge argument.
    const { client, transport } = await withSession()
    const customData: AnyMap = { via: 'v4' }
    await client.queueInsertItem(queueItems[0]!, null, customData)
    await client.queueInsertItems(queueItems, null)
    await client.queueInsertAndPlayItem(queueItems[0]!, null)
    expect(transport.mediaCalls).toEqual([
      { method: 'queueInsertItems', args: [[queueItems[0]], 0, customData] },
      { method: 'queueInsertItems', args: [queueItems, 0] },
      { method: 'queueInsertAndPlayItem', args: [queueItems[0], 0] },
    ])
  })

  it('setActiveMediaTracks (deprecated alias) defaults to clear, like setActiveTrackIds', async () => {
    const { client, transport } = await withSession()
    await client.setActiveMediaTracks()
    expect(transport.mediaCalls).toEqual([
      { method: 'setActiveTrackIds', args: [[]] },
    ])
  })
})

describe('RemoteMediaClient — rejection propagation', () => {
  it('rejects the CastError the transport rejects with', async () => {
    const { client, transport } = await withSession()
    transport.mediaBehavior.seek = async () => {
      throw { code: 'network', message: 'unreachable' } as CastError
    }
    await expect(client.seek(seekOptions)).rejects.toMatchObject({
      code: 'network',
    })
  })
})

describe('RemoteMediaClient — generation guard (Invariant 3, media flavour)', () => {
  it('a stale client rejects mutations with noSession before crossing the bridge', async () => {
    const { client, transport } = await withSession()
    transport.emitLifecycle({ type: 'ended' })

    await expect(client.play()).rejects.toMatchObject({ code: 'noSession' })
    // Nothing reached the transport.
    expect(transport.mediaCalls).toEqual([])
  })

  it('a stale client reads null (never another session’s status)', async () => {
    const { client, store, transport } = await withSession()
    transport.emitMediaStatus(mediaStatus(5))
    expect(client.getMediaStatus()).not.toBeNull()

    transport.emitLifecycle({ type: 'ended' })
    expect(client.getMediaStatus()).toBeNull()
    expect(client.getStreamPosition()).toBeNull()

    // Even if a brand-new session reports a status, the stale handle stays null.
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    transport.emitMediaStatus(mediaStatus(99))
    expect(client.getMediaStatus()).toBeNull()
    // ...while the store itself does hold the new session's status — proving the
    // stale handle filters out a status that is genuinely present.
    expect(
      store.getSliceState<MediaState>('media').currentStatus?.streamPosition
    ).toBe(99)
  })

  it('isActive flips false once the session ends', async () => {
    const { client, transport } = await withSession()
    expect(client.isActive).toBe(true)
    transport.emitLifecycle({ type: 'ended' })
    expect(client.isActive).toBe(false)
  })
})

describe('RemoteMediaClient.current — per-generation memoization', () => {
  it('returns null when there is no session', async () => {
    const { store, transport } = await setup()
    expect(RemoteMediaClient.current(store, transport)).toBeNull()
  })

  it('returns the same memoized client within a generation', async () => {
    const { store, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const a = RemoteMediaClient.current(store, transport)
    const b = RemoteMediaClient.current(store, transport)
    expect(a).not.toBeNull()
    expect(a).toBe(b)
  })

  it('returns a fresh client after the session changes', async () => {
    const { store, transport } = await setup()
    transport.emitLifecycle({ type: 'started', session: session('s1') })
    const first = RemoteMediaClient.current(store, transport)
    transport.emitLifecycle({ type: 'ended' })
    expect(RemoteMediaClient.current(store, transport)).toBeNull()
    transport.emitLifecycle({ type: 'started', session: session('s2') })
    const second = RemoteMediaClient.current(store, transport)
    expect(second).not.toBe(first)
    expect(second).not.toBeNull()
  })
})

describe('RemoteMediaClient.onMediaProgressUpdated — shared ticker', () => {
  // This suite drives the mocked singleton store (the one the shared ticker is
  // bound to), not a local store, since onMediaProgressUpdated reads the
  // process-wide progressTicker.
  beforeAll(async () => {
    await castStore.ready
  })

  it('ticks (position, duration) forward while playing, silent after remove', () => {
    // Fake timers BEFORE the playing status: the ticker's setInterval is created
    // on that push, so it must already be a fake timer to be advanceable.
    jest.useFakeTimers()
    mockNow = 0

    const transport = castTransport as unknown as FakeCastTransport
    transport.emitLifecycle({ type: 'started', session: session('rmc') })

    const client = RemoteMediaClient.current(castStore, castTransport)
    expect(client).not.toBeNull()

    const calls: Array<[number, number]> = []
    const sub = client!.onMediaProgressUpdated((p, d) => calls.push([p, d]), 1)

    // Playing status anchored at mockNow=0: base position 0, duration 100.
    transport.emitMediaStatus({
      streamPosition: 0,
      playerState: 'playing',
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      queueItems: [],
      mediaInfo: { contentUrl: 'x', streamDuration: 100 },
    })

    // The status push notifies once at the anchor time → position 0.
    expect(calls).toEqual([[0, 100]])

    // Advance the injected clock and the timer in lockstep: interval 1s over 2s
    // fires twice, both observing mockNow=2000 → position 2 (0 + 2s × rate 1).
    mockNow = 2000
    jest.advanceTimersByTime(2000)

    expect(calls.length).toBe(3)
    const [lastPos, lastDur] = calls[calls.length - 1]!
    expect(lastDur).toBe(100)
    expect(lastPos).toBe(2)

    // After remove, further ticks are silent (the shared timer is torn down).
    const frozen = calls.length
    sub.remove()
    mockNow = 5000
    jest.advanceTimersByTime(5000)
    expect(calls.length).toBe(frozen)

    transport.emitLifecycle({ type: 'ended' })
    jest.useRealTimers()
  })

  it('a stale client returns a no-op subscription (never a later session)', () => {
    jest.useFakeTimers()
    mockNow = 0
    const transport = castTransport as unknown as FakeCastTransport

    transport.emitLifecycle({ type: 'started', session: session('stale1') })
    const client = RemoteMediaClient.current(castStore, castTransport)!
    // The session ends → this handle is now stale.
    transport.emitLifecycle({ type: 'ended' })
    expect(client.isActive).toBe(false)

    const calls: number[] = []
    const sub = client.onMediaProgressUpdated((p) => calls.push(p), 1)

    // A brand-new session starts playing; the stale handle must stay silent.
    transport.emitLifecycle({ type: 'started', session: session('stale2') })
    transport.emitMediaStatus({
      streamPosition: 5,
      playerState: 'playing',
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      queueItems: [],
      mediaInfo: { contentUrl: 'x', streamDuration: 100 },
    })
    mockNow = 3000
    jest.advanceTimersByTime(3000)
    expect(calls).toEqual([])

    sub.remove() // no-op, safe to call
    transport.emitLifecycle({ type: 'ended' })
    jest.useRealTimers()
  })

  it('auto-unsubscribes once its own session ends, never leaking the next', () => {
    jest.useFakeTimers()
    mockNow = 0
    const transport = castTransport as unknown as FakeCastTransport

    transport.emitLifecycle({ type: 'started', session: session('live1') })
    const client = RemoteMediaClient.current(castStore, castTransport)!

    const calls: number[] = []
    client.onMediaProgressUpdated((p) => calls.push(p), 1)
    transport.emitMediaStatus({
      streamPosition: 0,
      playerState: 'playing',
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      queueItems: [],
      mediaInfo: { contentUrl: 'x', streamDuration: 100 },
    })
    mockNow = 1000
    jest.advanceTimersByTime(1000)
    const whileLive = calls.length
    expect(whileLive).toBeGreaterThan(0)

    // Its session ends: the teardown notification runs the callback once more,
    // which sees the stale handle and self-unsubscribes.
    transport.emitLifecycle({ type: 'ended' })

    // A fresh session plays; the now-detached handler must not fire again.
    transport.emitLifecycle({ type: 'started', session: session('live2') })
    transport.emitMediaStatus({
      streamPosition: 50,
      playerState: 'playing',
      playbackRate: 1,
      volume: 1,
      isMuted: false,
      queueItems: [],
      mediaInfo: { contentUrl: 'y', streamDuration: 100 },
    })
    mockNow = 5000
    jest.advanceTimersByTime(4000)
    expect(calls.length).toBe(whileLive)

    transport.emitLifecycle({ type: 'ended' })
    jest.useRealTimers()
  })
})
