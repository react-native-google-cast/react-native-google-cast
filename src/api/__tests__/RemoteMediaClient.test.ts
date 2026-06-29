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
import { RemoteMediaClient } from '../RemoteMediaClient'

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
    // If T4a grows the surface, this list must grow too.
    expect(cases).toHaveLength(19)
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
