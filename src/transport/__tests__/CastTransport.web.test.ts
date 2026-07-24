import type { CastError, CastState } from '../types'
import type { Device } from '../../types/Device'
import type { MediaStatus } from '../../types/MediaStatus'
import type { SessionLifecycleEvent } from '../types'
import { createWebCastTransport } from '../CastTransport.web'
import {
  FakeCastSession,
  FakeMedia,
  clearWebSdkGlobals,
  installFakeWebSdk,
} from '../__fakes__/fakeWebCastSdk'
import type { InstalledFakeWebSdk } from '../__fakes__/fakeWebCastSdk'

interface Recorded {
  states: CastState[]
  devices: Device[][]
  lifecycle: SessionLifecycleEvent[]
  media: Array<MediaStatus | undefined>
  channelMessages: Array<{ namespace: string; message: string }>
  channelStatuses: Array<{
    namespace: string
    connected: boolean
    writable: boolean
  }>
}

function record(): Recorded {
  return {
    states: [],
    devices: [],
    lifecycle: [],
    media: [],
    channelMessages: [],
    channelStatuses: [],
  }
}

async function init(transport = createWebCastTransport()) {
  const events = record()
  const snapshot = await transport.initAndSubscribe(
    (castState) => events.states.push(castState),
    (devices) => events.devices.push(devices),
    (event) => events.lifecycle.push(event),
    (status) => events.media.push(status),
    (namespace, message) => events.channelMessages.push({ namespace, message }),
    (namespace, connected, writable) =>
      events.channelStatuses.push({ namespace, connected, writable })
  )
  return { transport, events, snapshot }
}

/** Install the fake SDK + a live started session on its context. */
function installWithSession(sdk: InstalledFakeWebSdk): FakeCastSession {
  const session = new FakeCastSession()
  sdk.context.currentSession = session
  return session
}

async function expectCastError(
  promise: Promise<unknown>,
  code: CastError['code']
): Promise<CastError> {
  const error = (await promise.then(
    () => {
      throw new Error(`expected rejection with code ${code}`)
    },
    (e: unknown) => e
  )) as CastError
  expect(error.code).toBe(code)
  return error
}

afterEach(() => {
  clearWebSdkGlobals()
})

describe('CastTransport.web — SDK unavailable', () => {
  it('resolves the safe snapshot and stays gracefully inert', async () => {
    const { transport, snapshot, events } = await init()
    expect(snapshot).toEqual({
      castState: 'noDevicesAvailable',
      playServicesState: 'success',
      devices: [],
    })
    expect(transport.isAvailable).toBe(false)
    expect(events.states).toEqual([])
    await expectCastError(transport.play(), 'notSupported')
    await expectCastError(
      transport.loadMedia({ mediaInfo: { contentUrl: 'https://x/y.mp4' } }),
      'notSupported'
    )
    await expect(transport.showCastDialog()).resolves.toBe(false)
    await expect(transport.showExpandedControls()).resolves.toBe(false)
    await expect(transport.showIntroductoryOverlay(true)).resolves.toBe(false)
    await expect(transport.showPlayServicesErrorDialog(1)).resolves.toBe(false)
    // Discovery is browser-owned: controls are inert no-ops.
    transport.startDiscovery()
    transport.stopDiscovery()
    transport.setPassiveScan(true)
    expect(transport.isDiscovering).toBe(false)
    expect(transport.isPassiveScan).toBe(false)
  })
})

describe('CastTransport.web — __onGCastApiAvailable handshake', () => {
  it('activates on late SDK arrival, chains the page handler, pushes state', async () => {
    const pageHandler = jest.fn()
    ;(globalThis as any).__onGCastApiAvailable = pageHandler

    const { transport, events, snapshot } = await init()
    expect(snapshot.castState).toBe('noDevicesAvailable')
    expect(transport.isAvailable).toBe(false)

    const sdk = installFakeWebSdk()
    sdk.context.castState = 'NOT_CONNECTED'
    ;(globalThis as any).__onGCastApiAvailable(true)

    expect(pageHandler).toHaveBeenCalledWith(true, undefined)
    expect(transport.isAvailable).toBe(true)
    expect(events.states).toEqual(['notConnected'])
    // setOptions is owned by the transport: default receiver + origin scoped.
    expect(sdk.context.setOptionsCalls).toEqual([
      {
        receiverApplicationId: 'CC1AD845',
        autoJoinPolicy: 'origin_scoped',
      },
    ])
  })

  it('does not activate when the SDK reports unavailable, then does on true', async () => {
    const { transport } = await init()
    installFakeWebSdk()
    ;(globalThis as any).__onGCastApiAvailable(false)
    expect(transport.isAvailable).toBe(false)
    ;(globalThis as any).__onGCastApiAvailable(true)
    expect(transport.isAvailable).toBe(true)
  })

  it('honors __RNGoogleCastOptions', async () => {
    ;(globalThis as any).__RNGoogleCastOptions = {
      receiverAppId: 'ABCD1234',
      autoJoinPolicy: 'tab_and_origin_scoped',
      language: 'cs',
      resumeSavedSession: false,
    }
    const { transport } = await init()
    const sdk = installFakeWebSdk()
    ;(globalThis as any).__onGCastApiAvailable(true)
    expect(transport.isAvailable).toBe(true)
    expect(sdk.context.setOptionsCalls).toEqual([
      {
        receiverApplicationId: 'ABCD1234',
        autoJoinPolicy: 'tab_and_origin_scoped',
        language: 'cs',
        resumeSavedSession: false,
      },
    ])
  })

  it('announces a session reconnected before the SDK handshake as resumed + status', async () => {
    const { events } = await init()
    const sdk = installFakeWebSdk()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    media.estimatedTime = 12
    session.mediaSession = media
    ;(globalThis as any).__onGCastApiAvailable(true)

    expect(events.lifecycle).toHaveLength(1)
    expect(events.lifecycle[0].type).toBe('resumed')
    expect(events.lifecycle[0].session?.sessionId).toBe('web-session-1')
    expect(events.media).toHaveLength(1)
    expect(events.media[0]?.streamPosition).toBe(12)
  })
})

describe('CastTransport.web — SDK present at init', () => {
  it('returns the mapped snapshot and subscribes to cast-state changes', async () => {
    const sdk = installFakeWebSdk()
    sdk.context.castState = 'CONNECTING'
    const { transport, snapshot, events } = await init()

    expect(transport.isAvailable).toBe(true)
    expect(snapshot.castState).toBe('connecting')
    expect(snapshot.devices).toEqual([])
    expect(snapshot.playServicesState).toBe('success')

    sdk.context.emitCastState('CONNECTED')
    sdk.context.emitCastState('NOT_CONNECTED')
    sdk.context.emitCastState('NO_DEVICES_AVAILABLE')
    expect(events.states).toEqual([
      'connected',
      'notConnected',
      'noDevicesAvailable',
    ])
  })

  it('seeds a cold-start session and its media status through the snapshot (v5-az2)', async () => {
    const sdk = installFakeWebSdk()
    const session = installWithSession(sdk)
    session.activeInput = 1
    const media = new FakeMedia()
    media.playerState = 'PAUSED'
    media.estimatedTime = 100.5
    media.repeatMode = 'REPEAT_ALL'
    media.currentItemId = 3
    session.mediaSession = media

    const { snapshot } = await init()
    expect(snapshot.currentSession).toEqual({
      sessionId: 'web-session-1',
      device: {
        deviceId: 'device-1',
        friendlyName: 'Living Room TV',
        capabilities: ['VideoOut', 'AudioOut'],
        deviceVersion: '',
        ipAddress: '',
        modelName: '',
        icons: [],
      },
      deviceVolume: 0.4,
      deviceMuted: false,
      standbyState: 'unknown',
      activeInputState: 'active',
      applicationMetadata: {
        applicationId: 'CC1AD845',
        name: 'Default Media Receiver',
        images: [],
        namespaces: ['urn:x-cast:com.example'],
      },
      applicationStatus: 'Ready to cast',
    })
    expect(snapshot.mediaStatus).toMatchObject({
      playerState: 'paused',
      streamPosition: 100.5,
      queueRepeatMode: 'all',
      currentItemId: 3,
    })
    // The status stream is attached for subsequent pushes.
    expect(media.updateListenerCount()).toBe(1)
  })
})

describe('CastTransport.web — session lifecycle', () => {
  it('maps the SessionState stream to ordered lifecycle events', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = new FakeCastSession()

    sdk.context.emitSessionState(session, 'SESSION_STARTING')
    sdk.context.currentSession = session
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    sdk.context.emitSessionState(session, 'SESSION_ENDING')
    sdk.context.currentSession = null
    sdk.context.emitSessionState(session, 'SESSION_ENDED')

    expect(events.lifecycle.map((event) => event.type)).toEqual([
      'starting',
      'started',
      'ending',
      'ended',
    ])
    expect(events.lifecycle[0].deviceId).toBe('device-1')
    expect(events.lifecycle[1].session?.sessionId).toBe('web-session-1')
    expect(events.lifecycle[1].session?.deviceVolume).toBe(0.4)
    expect(events.lifecycle[2].session?.sessionId).toBe('web-session-1')
    expect(events.lifecycle[3].error).toBeUndefined()
  })

  it('maps start failure and errored end to typed CastErrors', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = new FakeCastSession()

    sdk.context.emitSessionState(session, 'SESSION_START_FAILED', 'timeout')
    sdk.context.emitSessionState(session, 'SESSION_ENDED', 'session_error')

    expect(events.lifecycle[0].type).toBe('startFailed')
    expect(events.lifecycle[0].error?.code).toBe('timeout')
    expect(events.lifecycle[1].type).toBe('ended')
    expect(events.lifecycle[1].error?.code).toBe('noSession')
  })

  it('maps SESSION_RESUMED (page reload reconnect) to resumed + media status', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = new FakeCastSession()
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.currentSession = session

    sdk.context.emitSessionState(session, 'SESSION_RESUMED')

    expect(events.lifecycle.map((event) => event.type)).toEqual(['resumed'])
    expect(events.media).toHaveLength(1)
    expect(events.media[0]?.playerState).toBe('playing')
    expect(media.updateListenerCount()).toBe(1)
  })

  it('streams device-detail changes as fresh full SessionInfo payloads', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.lifecycle.length = 0

    session.volumeLevel = 0.9
    session.emit('volumechanged', { volume: 0.9, isMute: false })
    session.applicationStatus = 'Now playing'
    session.emit('applicationstatuschanged', { status: 'Now playing' })
    session.activeInput = 1
    session.emit('activeinputstatechanged', { activeInputState: 1 })

    expect(events.lifecycle.map((event) => event.type)).toEqual([
      'deviceStatusChanged',
      'deviceStatusChanged',
      'activeInputStateChanged',
    ])
    expect(events.lifecycle[0].session?.deviceVolume).toBe(0.9)
    expect(events.lifecycle[1].session?.applicationStatus).toBe('Now playing')
    expect(events.lifecycle[2].session?.activeInputState).toBe('active')
  })

  it('drops a detail change racing a teardown (no current session)', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.lifecycle.length = 0

    sdk.context.currentSession = null
    session.emit('volumechanged', { volume: 0.1, isMute: false })
    expect(events.lifecycle).toEqual([])
  })
})

describe('CastTransport.web — media status stream', () => {
  it('pushes converted statuses on media updates', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    media.playerState = 'BUFFERING'
    media.playbackRate = 2
    media.volume = { level: 0.25, muted: true }
    media.items = [
      {
        itemId: 7,
        media: { contentId: 'https://x/a.mp4', contentType: 'video/mp4' },
        autoplay: true,
        startTime: 5,
      },
    ]
    media.emitUpdate(true)

    expect(events.media).toHaveLength(1)
    const status = events.media[0]!
    expect(status.playerState).toBe('buffering')
    expect(status.playbackRate).toBe(2)
    expect(status.volume).toBe(0.25)
    expect(status.isMuted).toBe(true)
    expect(status.queueItems).toEqual([
      {
        itemId: 7,
        mediaInfo: {
          contentUrl: 'https://x/a.mp4',
          contentId: 'https://x/a.mp4',
          contentType: 'video/mp4',
        },
        autoplay: true,
        startTime: 5,
      },
    ])
  })

  it('forwards Media.videoInfo into MediaStatus.videoInfo (and omits it when absent)', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    media.emitUpdate(true)
    expect(events.media[0]?.videoInfo).toBeUndefined()

    // The shipped SDK's chrome.cast.media.HdrType wire values are lowercase
    // ({SDR: 'sdr', HDR: 'hdr', DV: 'dv'}).
    media.videoInfo = { width: 3840, height: 2160, hdrType: 'hdr' }
    media.emitUpdate(true)
    expect(events.media[1]?.videoInfo).toEqual({
      width: 3840,
      height: 2160,
      hdrType: 'HDR',
    })
  })

  it('maps incoming HLS segment formats from the lowercase wire values', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    media.media = {
      contentId: 'https://x/live.m3u8',
      contentType: 'application/x-mpegurl',
      hlsSegmentFormat: 'ts_aac',
      hlsVideoSegmentFormat: 'fmp4',
    }
    media.emitUpdate(true)

    expect(events.media[0]?.mediaInfo?.hlsSegmentFormat).toBe('TS_AAC')
    expect(events.media[0]?.mediaInfo?.hlsVideoSegmentFormat).toBe('FMP4')
  })

  it('collects application-defined metadata keys into customData for any metadata type', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    media.media = {
      contentId: 'https://x/movie.mp4',
      contentType: 'video/mp4',
      metadata: {
        metadataType: 1, // MOVIE — customData is not a `user`-only feature
        title: 'Big Buck Bunny',
        myKey: 'custom-value',
        rating: 5,
        type: 1, // deprecated SDK alias — neither standard nor custom
        releaseYear: 2008, // deprecated SDK alias — dropped
      },
    }
    media.emitUpdate(true)

    expect(events.media[0]?.mediaInfo?.metadata).toEqual({
      type: 'movie',
      title: 'Big Buck Bunny',
      customData: { myKey: 'custom-value', rating: 5 },
    })
  })

  it('attaches to a new media session announced via MEDIA_SESSION', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    expect(events.media).toHaveLength(0) // no media at start

    const media = new FakeMedia()
    session.mediaSession = media
    session.emit('mediasession', { mediaSession: media })

    expect(events.media).toHaveLength(1)
    expect(media.updateListenerCount()).toBe(1)
  })

  it('pushes undefined (null-clear, v5-82w) when media dies mid-session', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    session.mediaSession = null
    media.emitUpdate(false)

    expect(events.media).toEqual([undefined])
    expect(media.updateListenerCount()).toBe(0) // detached from the dead session
  })

  it('does not push a clear when the whole cast session is already gone', async () => {
    const sdk = installFakeWebSdk()
    const { events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    events.media.length = 0

    sdk.context.currentSession = null
    media.emitUpdate(false)
    expect(events.media).toEqual([])
  })
})

describe('CastTransport.web — requestSession flows', () => {
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('startSession opens the browser picker, warning (dev-only) that deviceId is ignored', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    await expect(transport.startSession('ignored-device-id')).resolves.toBe(
      undefined
    )
    expect(sdk.context.requestSessionCalls).toBe(1)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('ignores deviceId')
    expect(warnSpy.mock.calls[0][0]).toContain('ignored-device-id')

    // No deviceId → nothing to flag.
    warnSpy.mockClear()
    await transport.startSession('')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('startSession maps user cancellation to cancelled', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    sdk.context.requestSessionImpl = async () => {
      throw 'cancel' // the SDK rejects with a bare ErrorCode string
    }
    await expectCastError(transport.startSession('x'), 'cancelled')
  })

  it('showCastDialog: true on success and on user cancel, false when receivers are unavailable, rejects otherwise', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()

    await expect(transport.showCastDialog()).resolves.toBe(true)

    sdk.context.requestSessionImpl = async () => {
      throw 'cancel'
    }
    await expect(transport.showCastDialog()).resolves.toBe(true)

    sdk.context.requestSessionImpl = async () => {
      throw 'receiver_unavailable'
    }
    await expect(transport.showCastDialog()).resolves.toBe(false)

    sdk.context.requestSessionImpl = async () => {
      throw { code: 'timeout', description: 'Timed out.' }
    }
    await expectCastError(transport.showCastDialog(), 'timeout')
  })

  it('endCurrentSession requires a session and forwards stopCasting', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    await expectCastError(transport.endCurrentSession(true), 'noSession')

    installWithSession(sdk)
    await transport.endCurrentSession(true)
    expect(sdk.context.endCurrentSession).toHaveBeenCalledWith(true)
  })
})

describe('CastTransport.web — device volume', () => {
  it('routes setDeviceVolume/setDeviceMuted through the CastSession', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    await expectCastError(transport.setDeviceVolume(0.7), 'noSession')

    const session = installWithSession(sdk)
    await transport.setDeviceVolume(0.7)
    expect(session.setVolume).toHaveBeenCalledWith(0.7)
    await transport.setDeviceMuted(true)
    expect(session.setMute).toHaveBeenCalledWith(true)
  })

  it('maps a resolved ErrorCode to a typed rejection', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    const session = installWithSession(sdk)
    session.setVolume.mockResolvedValueOnce('timeout')
    await expectCastError(transport.setDeviceVolume(0.2), 'timeout')
  })
})

describe('CastTransport.web — custom channels', () => {
  const NS = 'urn:x-cast:com.example'

  it('requires a session, registers once, and emits the initial status before resolving', async () => {
    const sdk = installFakeWebSdk()
    const { transport, events } = await init()
    await expectCastError(transport.addChannel(NS), 'noSession')

    const session = installWithSession(sdk)
    await transport.addChannel(NS)
    // Web mirrors Android: one {connected, writable} report, never updated.
    expect(events.channelStatuses).toEqual([
      { namespace: NS, connected: true, writable: true },
    ])
    expect(session.messageListeners.get(NS)?.size).toBe(1)

    await expectCastError(transport.addChannel(NS), 'alreadyRegistered')
  })

  it('streams inbound messages and sends outbound ones', async () => {
    const sdk = installFakeWebSdk()
    const { transport, events } = await init()
    const session = installWithSession(sdk)
    await transport.addChannel(NS)

    session.emitMessage(NS, '{"hello":"world"}')
    expect(events.channelMessages).toEqual([
      { namespace: NS, message: '{"hello":"world"}' },
    ])

    await transport.sendMessage(NS, '{"cmd":"play"}')
    expect(session.sendMessage).toHaveBeenCalledWith(NS, '{"cmd":"play"}')
  })

  it('rejects sendMessage on an unregistered namespace', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    installWithSession(sdk)
    await expectCastError(transport.sendMessage(NS, 'x'), 'invalidRequest')
  })

  it('removeChannel detaches and is idempotent', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    const session = installWithSession(sdk)
    await transport.addChannel(NS)
    await transport.removeChannel(NS)
    expect(session.messageListeners.get(NS)?.size).toBe(0)
    await expect(transport.removeChannel(NS)).resolves.toBe(undefined)
    // Re-registration after removal is allowed.
    await expect(transport.addChannel(NS)).resolves.toBe(undefined)
  })

  it('clears the registry on session end (A1)', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    await transport.addChannel(NS)

    sdk.context.currentSession = null
    sdk.context.emitSessionState(session, 'SESSION_ENDED')

    expect(session.messageListeners.get(NS)?.size).toBe(0)
    await expectCastError(transport.sendMessage(NS, 'x'), 'invalidRequest')
  })
})

describe('CastTransport.web — media mutations', () => {
  async function initWithMedia() {
    const sdk = installFakeWebSdk()
    const setup = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    return { ...setup, sdk, session, media }
  }

  it('rejects noSession without a session, and without a media session', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    await expectCastError(transport.play(), 'noSession')
    installWithSession(sdk) // session but no media session
    await expectCastError(transport.pause(), 'noSession')
  })

  it('loadMedia converts the full MediaLoadRequest', async () => {
    const { transport, session } = await initWithMedia()
    await transport.loadMedia({
      mediaInfo: {
        contentUrl: 'https://x/movie.mp4',
        contentType: 'video/mp4',
        streamType: 'buffered',
        streamDuration: 120,
        metadata: {
          type: 'movie',
          title: 'Big Buck Bunny',
          studio: 'Blender',
          images: [{ url: 'https://x/poster.jpg', width: 100 }],
          // customData crosses for EVERY metadata type (native parity), not
          // just `user`.
          customData: { myKey: 'custom-value', rating: 5 },
        },
        customData: { source: 'test' },
      },
      autoplay: false,
      startTime: 30,
      playbackRate: 1.5,
      credentials: 'user-token',
      credentialsType: 'cookie',
      customData: { context: 'load' },
    })

    expect(session.loadMedia).toHaveBeenCalledTimes(1)
    const request = session.loadMedia.mock.calls[0][0]
    expect(request.autoplay).toBe(false)
    expect(request.currentTime).toBe(30)
    expect(request.playbackRate).toBe(1.5)
    expect(request.credentials).toBe('user-token')
    expect(request.credentialsType).toBe('cookie')
    expect(request.customData).toEqual({ context: 'load' })
    expect(request.media.contentId).toBe('https://x/movie.mp4')
    expect(request.media.contentUrl).toBe('https://x/movie.mp4')
    expect(request.media.contentType).toBe('video/mp4')
    expect(request.media.streamType).toBe('BUFFERED')
    expect(request.media.duration).toBe(120)
    expect(request.media.customData).toEqual({ source: 'test' })
    expect(request.media.metadata).toMatchObject({
      metadataType: 1, // MOVIE — custom keys never clobber the discriminant
      title: 'Big Buck Bunny',
      studio: 'Blender',
      myKey: 'custom-value',
      rating: 5,
    })
    expect(request.media.metadata.images[0].url).toBe('https://x/poster.jpg')
    expect(request.media.metadata.images[0].width).toBe(100)
  })

  it('loadMedia writes the SDK HLS enum wire values (lowercase)', async () => {
    const { transport, session } = await initWithMedia()
    await transport.loadMedia({
      mediaInfo: {
        contentUrl: 'https://x/live.m3u8',
        contentType: 'application/x-mpegurl',
        streamType: 'live',
        hlsSegmentFormat: 'E-AC3',
        hlsVideoSegmentFormat: 'MPEG2-TS',
      },
    })
    const request = session.loadMedia.mock.calls[0][0]
    // The shipped SDK defines chrome.cast.media.HlsSegmentFormat /
    // HlsVideoSegmentFormat with lowercase VALUES under uppercase member
    // names ({E_AC3: 'e_ac3'}, {MPEG2_TS: 'mpeg2_ts'}).
    expect(request.media.hlsSegmentFormat).toBe('e_ac3')
    expect(request.media.hlsVideoSegmentFormat).toBe('mpeg2_ts')
  })

  it('loadMedia with queueData forwards the FULL queue on LoadRequest.queueData', async () => {
    const { transport, session } = await initWithMedia()
    await transport.loadMedia({
      queueData: {
        id: 'queue-1',
        name: 'Road Trip Mix',
        entity: 'entity://playlists/road-trip',
        type: 'playlist',
        repeatMode: 'all',
        containerMetadata: {
          containerType: 'audioBook',
          title: 'Container Title',
          containerDuration: 3600,
          containerImages: [{ url: 'https://x/cover.jpg', width: 480 }],
          sections: [{ type: 'generic', title: 'Chapter 1' }],
        },
        items: [
          { mediaInfo: { contentUrl: 'https://x/1.mp4' } },
          { mediaInfo: { contentUrl: 'https://x/2.mp4' }, startTime: 9 },
        ],
        startIndex: 1,
        startTime: 42,
      },
    })

    expect(session.loadMedia).toHaveBeenCalledTimes(1)
    const request = session.loadMedia.mock.calls[0][0]
    // The web LoadRequest constructor requires a MediaInfo — the first queue
    // item's media stands in; queueData governs on the receiver.
    expect(request.media.contentId).toBe('https://x/1.mp4')
    expect(request.queueData).toMatchObject({
      id: 'queue-1',
      name: 'Road Trip Mix',
      entity: 'entity://playlists/road-trip',
      queueType: 'PLAYLIST',
      repeatMode: 'REPEAT_ALL',
      startIndex: 1,
      startTime: 42,
    })
    expect(request.queueData.items).toHaveLength(2)
    expect(request.queueData.items[1].media.contentId).toBe('https://x/2.mp4')
    expect(request.queueData.items[1].startTime).toBe(9)
    expect(request.queueData.containerMetadata).toMatchObject({
      containerType: 1, // AUDIOBOOK_CONTAINER
      title: 'Container Title',
      containerDuration: 3600,
    })
    expect(request.queueData.containerMetadata.containerImages[0].url).toBe(
      'https://x/cover.jpg'
    )
    expect(request.queueData.containerMetadata.sections[0]).toMatchObject({
      metadataType: 0, // GENERIC
      title: 'Chapter 1',
    })
  })

  it('loadMedia rejects a request with neither mediaInfo nor a non-empty queueData', async () => {
    const { transport } = await initWithMedia()
    await expectCastError(transport.loadMedia({}), 'invalidParameter')
    await expectCastError(
      transport.loadMedia({ queueData: { items: [] } }),
      'invalidParameter'
    )
  })

  it('loadMedia maps a resolved ErrorCode to a typed rejection', async () => {
    const { transport, session } = await initWithMedia()
    session.loadMedia.mockResolvedValueOnce('load_media_failed')
    await expectCastError(
      transport.loadMedia({ mediaInfo: { contentUrl: 'https://x/y.mp4' } }),
      'failed'
    )
  })

  it('routes transport controls with customData', async () => {
    const { transport, media } = await initWithMedia()
    await transport.play({ a: 1 })
    await transport.pause()
    await transport.stop({ b: 2 })
    expect(media.calls.map((call) => call.method)).toEqual([
      'play',
      'pause',
      'stop',
    ])
    expect(media.calls[0].args[0].customData).toEqual({ a: 1 })
    expect(media.calls[1].args[0].customData).toBeUndefined()
    expect(media.calls[2].args[0].customData).toEqual({ b: 2 })
  })

  it('seek: absolute, relative, infinite, resume state', async () => {
    const { transport, media } = await initWithMedia()
    media.estimatedTime = 42

    await transport.seek({ position: 10, resumeState: 'play' })
    await transport.seek({ position: -10, relative: true })
    media.liveSeekableRange = { start: 0, end: 99 }
    await transport.seek({ infinite: true, resumeState: 'pause' })

    const requests = media.calls.map((call) => call.args[0])
    expect(requests[0].currentTime).toBe(10)
    expect(requests[0].resumeState).toBe('PLAYBACK_START')
    expect(requests[1].currentTime).toBe(32)
    expect(requests[1].resumeState).toBeUndefined()
    expect(requests[2].currentTime).toBe(99)
    expect(requests[2].resumeState).toBe('PLAYBACK_PAUSE')
  })

  it('seek({infinite}) without a live range or duration rejects invalidParameter', async () => {
    const { transport } = await initWithMedia()
    await expectCastError(
      transport.seek({ infinite: true }),
      'invalidParameter'
    )
  })

  it('setPlaybackRate is honestly unsupported on web', async () => {
    const { transport } = await initWithMedia()
    await expectCastError(transport.setPlaybackRate(1.5), 'notSupported')
  })

  it('tracks: setActiveTrackIds and setTextTrackStyle via editTracksInfo', async () => {
    const { transport, media } = await initWithMedia()
    await transport.setActiveTrackIds([1, 2])
    await transport.setTextTrackStyle({
      foregroundColor: '#FFFFFFFF',
      edgeType: 'dropShadow',
      windowType: 'rounded',
      fontGenericFamily: 'monoSansSerif',
      fontStyle: 'boldItalic',
      windowCornerRadius: 4,
    })

    expect(media.calls[0].method).toBe('editTracksInfo')
    expect(media.calls[0].args[0].activeTrackIds).toEqual([1, 2])
    const style = media.calls[1].args[0].textTrackStyle
    expect(style.foregroundColor).toBe('#FFFFFFFF')
    expect(style.edgeType).toBe('DROP_SHADOW')
    expect(style.windowType).toBe('ROUNDED_CORNERS')
    expect(style.fontGenericFamily).toBe('MONOSPACED_SANS_SERIF')
    expect(style.fontStyle).toBe('BOLD_ITALIC')
    expect(style.windowRoundedCornerRadius).toBe(4)
  })

  it('stream volume/mute via VolumeRequest', async () => {
    const { transport, media } = await initWithMedia()
    await transport.setStreamVolume(0.3, { why: 'test' })
    await transport.setStreamMuted(true)

    expect(media.calls[0].method).toBe('setVolume')
    expect(media.calls[0].args[0].volume.level).toBe(0.3)
    expect(media.calls[0].args[0].customData).toEqual({ why: 'test' })
    expect(media.calls[1].args[0].volume.muted).toBe(true)
    expect(media.calls[1].args[0].volume.level).toBeNull()
  })

  it('queue operations map to the web queue requests', async () => {
    const { transport, media, session } = await initWithMedia()

    await transport.queueLoad(
      [{ mediaInfo: { contentUrl: 'https://x/1.mp4' } }],
      0,
      'single'
    )
    expect(session.queueLoadCalls[0].args[0].repeatMode).toBe('REPEAT_SINGLE')

    await transport.queueInsertItems(
      [{ mediaInfo: { contentUrl: 'https://x/2.mp4' } }],
      0 // append sentinel
    )
    await transport.queueInsertItems(
      [{ mediaInfo: { contentUrl: 'https://x/3.mp4' } }],
      5,
      { pos: 'before-5' }
    )
    await transport.queueReorderItems([3, 1], 2)
    await transport.queueRemoveItems([4, 5])
    await transport.queueNext()
    await transport.queuePrev()
    await transport.queueJumpToItem(9)
    await transport.queueSetRepeatMode('allAndShuffle')
    await transport.requestMediaStatus()

    const methods = media.calls.map((call) => call.method)
    expect(methods).toEqual([
      'queueInsertItems',
      'queueInsertItems',
      'queueReorderItems',
      'queueRemoveItem',
      'queueRemoveItem',
      'queueNext',
      'queuePrev',
      'queueJumpToItem',
      'queueSetRepeatMode',
      'getStatus',
    ])
    expect(media.calls[0].args[0].insertBefore).toBeUndefined()
    expect(media.calls[1].args[0].insertBefore).toBe(5)
    expect(media.calls[1].args[0].customData).toEqual({ pos: 'before-5' })
    expect(media.calls[2].args[0].itemIds).toEqual([3, 1])
    expect(media.calls[2].args[0].insertBefore).toBe(2)
    expect(media.calls[3].args).toEqual([4])
    expect(media.calls[4].args).toEqual([5])
    expect(media.calls[7].args).toEqual([9])
    expect(media.calls[8].args).toEqual(['REPEAT_ALL_AND_SHUFFLE'])
  })

  it('queueInsertAndPlayItem is honestly unsupported on web', async () => {
    const { transport } = await initWithMedia()
    await expectCastError(
      transport.queueInsertAndPlayItem(
        { mediaInfo: { contentUrl: 'https://x/1.mp4' } },
        0
      ),
      'notSupported'
    )
  })

  it('a mid-sequence queueRemoveItems failure rejects and stops', async () => {
    const { transport, media } = await initWithMedia()
    media.errors.queueRemoveItem = { code: 'invalid_parameter' }
    await expectCastError(
      transport.queueRemoveItems([1, 2, 3]),
      'invalidParameter'
    )
    expect(
      media.calls.filter((call) => call.method === 'queueRemoveItem')
    ).toHaveLength(1)
  })

  it('maps SDK command errors to typed CastErrors', async () => {
    const { transport, media } = await initWithMedia()
    media.errors.play = { code: 'timeout', description: 'Request timed out' }
    const error = await expectCastError(transport.play(), 'timeout')
    expect(error.message).toContain('Request timed out')
  })
})

describe('CastTransport.web — T6 request ownership', () => {
  it('flushes in-flight session requests with interrupted on session end', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')

    session.setVolume.mockImplementationOnce(() => new Promise(() => {})) // never settles
    const pending = transport.setDeviceVolume(0.5)

    sdk.context.currentSession = null
    sdk.context.emitSessionState(session, 'SESSION_ENDED')
    await expectCastError(pending, 'interrupted')
  })

  it('the SDK settling first wins; the flush is then a no-op', async () => {
    const sdk = installFakeWebSdk()
    const { transport } = await init()
    const session = installWithSession(sdk)
    sdk.context.emitSessionState(session, 'SESSION_STARTED')

    await transport.setDeviceVolume(0.5) // settled
    sdk.context.currentSession = null
    sdk.context.emitSessionState(session, 'SESSION_ENDED') // must not throw
  })

  it('dispose flushes everything, detaches, and silences callbacks', async () => {
    const sdk = installFakeWebSdk()
    const { transport, events } = await init()
    const session = installWithSession(sdk)
    const media = new FakeMedia()
    session.mediaSession = media
    sdk.context.emitSessionState(session, 'SESSION_STARTED')
    await transport.addChannel('urn:x-cast:com.example')

    sdk.context.requestSessionImpl = () => new Promise(() => {}) // hangs
    const pendingStart = transport.startSession('x')

    const stateEvents = events.states.length
    transport.dispose()

    await expectCastError(pendingStart, 'interrupted')
    expect(sdk.context.listenerCount('caststatechanged')).toBe(0)
    expect(sdk.context.listenerCount('sessionstatechanged')).toBe(0)
    expect(session.listenerCount('volumechanged')).toBe(0)
    expect(session.listenerCount('mediasession')).toBe(0)
    expect(media.updateListenerCount()).toBe(0)
    expect(session.messageListeners.get('urn:x-cast:com.example')?.size).toBe(0)

    sdk.context.emitCastState('CONNECTED')
    expect(events.states.length).toBe(stateEvents)
    expect(transport.isAvailable).toBe(false)
  })
})
