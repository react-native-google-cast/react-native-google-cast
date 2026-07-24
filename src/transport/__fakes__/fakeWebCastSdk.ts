// (fake test double — permissive `any` shapes mirror the untyped SDK surface)
/**
 * In-memory fake of the Google Cast **Web Sender SDK** globals
 * (`window.chrome.cast` + `window.cast.framework`) for jest — the scriptable
 * seam the `CastTransport.web` tests drive. Only the surface the web
 * transport touches is modelled; enum wire values match the Web Sender
 * reference (https://developers.google.com/cast/docs/reference/web_sender/).
 */

type Listener = (event: any) => void

class FakeEventTarget {
  private readonly listeners = new Map<string, Set<Listener>>()

  addEventListener(type: string, handler: Listener): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(handler)
  }

  removeEventListener(type: string, handler: Listener): void {
    this.listeners.get(type)?.delete(handler)
  }

  listenerCount(type: string): number {
    return this.listeners.get(type)?.size ?? 0
  }

  emit(type: string, event: any): void {
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(event)
  }
}

export interface RecordedCall {
  method: string
  args: any[]
}

/** `chrome.cast.media.Media` fake: field bag + callback-style commands. */
export class FakeMedia {
  media: any = null
  playerState = 'PLAYING'
  idleReason: string | null = null
  playbackRate = 1
  volume: { level: number | null; muted: boolean | null } | undefined = {
    level: 0.5,
    muted: false,
  }
  activeTrackIds: number[] | null = null
  liveSeekableRange: any = undefined
  items: any[] | null = null
  currentItemId: number | null = null
  loadingItemId: number | null = null
  preloadedItemId: number | null = null
  repeatMode = 'REPEAT_OFF'
  customData: any = null
  videoInfo: any = undefined
  /** Value returned by `getEstimatedTime()`. */
  estimatedTime = 42

  /** Every issued command, in order. */
  readonly calls: RecordedCall[] = []
  /** Script a failure per method: `media.errors.play = {code: 'timeout'}`. */
  readonly errors: Record<string, any> = {}
  /**
   * Method names whose callbacks are held instead of auto-succeeding; the
   * test completes them via `pendingCommands[i].success()` / `.error(e)`.
   */
  readonly manual = new Set<string>()
  readonly pendingCommands: Array<{
    method: string
    success: () => void
    error: (e: any) => void
  }> = []

  private readonly updateListeners = new Set<(isAlive: boolean) => void>()

  getEstimatedTime(): number {
    return this.estimatedTime
  }

  addUpdateListener(listener: (isAlive: boolean) => void): void {
    this.updateListeners.add(listener)
  }

  removeUpdateListener(listener: (isAlive: boolean) => void): void {
    this.updateListeners.delete(listener)
  }

  updateListenerCount(): number {
    return this.updateListeners.size
  }

  /** Fire the SDK's media-status update to attached listeners. */
  emitUpdate(isAlive = true): void {
    for (const listener of [...this.updateListeners]) listener(isAlive)
  }

  private command(
    method: string,
    args: any[],
    success: () => void,
    error: (e: any) => void
  ): void {
    this.calls.push({ method, args })
    if (this.manual.has(method)) {
      this.pendingCommands.push({ method, success, error })
      return
    }
    const scripted = this.errors[method]
    if (scripted) error(scripted)
    else success()
  }

  getStatus(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('getStatus', [request], ok, fail)
  }
  play(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('play', [request], ok, fail)
  }
  pause(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('pause', [request], ok, fail)
  }
  stop(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('stop', [request], ok, fail)
  }
  seek(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('seek', [request], ok, fail)
  }
  setVolume(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('setVolume', [request], ok, fail)
  }
  editTracksInfo(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('editTracksInfo', [request], ok, fail)
  }
  queueInsertItems(request: any, ok: () => void, fail: (e: any) => void): void {
    this.command('queueInsertItems', [request], ok, fail)
  }
  queueJumpToItem(
    itemId: number,
    ok: () => void,
    fail: (e: any) => void
  ): void {
    this.command('queueJumpToItem', [itemId], ok, fail)
  }
  queueNext(ok: () => void, fail: (e: any) => void): void {
    this.command('queueNext', [], ok, fail)
  }
  queuePrev(ok: () => void, fail: (e: any) => void): void {
    this.command('queuePrev', [], ok, fail)
  }
  queueRemoveItem(
    itemId: number,
    ok: () => void,
    fail: (e: any) => void
  ): void {
    this.command('queueRemoveItem', [itemId], ok, fail)
  }
  queueReorderItems(
    request: any,
    ok: () => void,
    fail: (e: any) => void
  ): void {
    this.command('queueReorderItems', [request], ok, fail)
  }
  queueSetRepeatMode(
    repeatMode: string,
    ok: () => void,
    fail: (e: any) => void
  ): void {
    this.command('queueSetRepeatMode', [repeatMode], ok, fail)
  }
}

/** `cast.framework.CastSession` fake. */
export class FakeCastSession extends FakeEventTarget {
  sessionId = 'web-session-1'
  receiver: any = {
    label: 'device-1',
    friendlyName: 'Living Room TV',
    capabilities: ['video_out', 'audio_out'],
  }
  volumeLevel = 0.4
  muted = false
  activeInput = -1
  applicationMetadata: any = {
    applicationId: 'CC1AD845',
    name: 'Default Media Receiver',
    images: [],
    namespaces: ['urn:x-cast:com.example'],
  }
  applicationStatus = 'Ready to cast'
  mediaSession: FakeMedia | null = null

  /** Recorded queueLoad calls on the underlying `chrome.cast.Session`. */
  readonly queueLoadCalls: RecordedCall[] = []
  queueLoadError: any = null

  readonly messageListeners = new Map<
    string,
    Set<(namespace: string, message: string) => void>
  >()
  readonly removedMessageListeners: string[] = []

  loadMedia = jest.fn(async (_request: any): Promise<any> => undefined)
  sendMessage = jest.fn(
    async (_namespace: string, _data: any): Promise<any> => undefined
  )
  setVolume = jest.fn(async (level: number): Promise<any> => {
    this.volumeLevel = level
    return undefined
  })
  setMute = jest.fn(async (mute: boolean): Promise<any> => {
    this.muted = mute
    return undefined
  })

  getSessionId(): string {
    return this.sessionId
  }
  getCastDevice(): any {
    return this.receiver
  }
  getVolume(): number {
    return this.volumeLevel
  }
  isMute(): boolean {
    return this.muted
  }
  getActiveInputState(): number {
    return this.activeInput
  }
  getApplicationMetadata(): any {
    return this.applicationMetadata
  }
  getApplicationStatus(): string {
    return this.applicationStatus
  }
  getMediaSession(): FakeMedia | null {
    return this.mediaSession
  }

  getSessionObj(): any {
    return {
      queueLoad: (request: any, ok: () => void, fail: (e: any) => void) => {
        this.queueLoadCalls.push({ method: 'queueLoad', args: [request] })
        if (this.queueLoadError) fail(this.queueLoadError)
        else ok()
      },
    }
  }

  addMessageListener(
    namespace: string,
    listener: (namespace: string, message: string) => void
  ): void {
    let set = this.messageListeners.get(namespace)
    if (!set) {
      set = new Set()
      this.messageListeners.set(namespace, set)
    }
    set.add(listener)
  }

  removeMessageListener(
    namespace: string,
    listener: (namespace: string, message: string) => void
  ): void {
    this.messageListeners.get(namespace)?.delete(listener)
    this.removedMessageListeners.push(namespace)
  }

  /** Deliver an inbound receiver message on a namespace. */
  emitMessage(namespace: string, message: string): void {
    for (const listener of [...(this.messageListeners.get(namespace) ?? [])]) {
      listener(namespace, message)
    }
  }
}

/** `cast.framework.CastContext` fake. */
export class FakeCastContext extends FakeEventTarget {
  readonly setOptionsCalls: any[] = []
  castState = 'NOT_CONNECTED'
  currentSession: FakeCastSession | null = null
  requestSessionCalls = 0
  /** Script `requestSession`: resolve an ErrorCode, or reject. */
  requestSessionImpl: () => Promise<any> = async () => undefined
  endCurrentSession = jest.fn((_stopCasting: boolean) => {})

  setOptions(options: any): void {
    this.setOptionsCalls.push(options)
  }
  getCastState(): string {
    return this.castState
  }
  getCurrentSession(): FakeCastSession | null {
    return this.currentSession
  }
  requestSession(): Promise<any> {
    this.requestSessionCalls++
    return this.requestSessionImpl()
  }

  emitCastState(state: string): void {
    this.castState = state
    this.emit('caststatechanged', { castState: state })
  }

  emitSessionState(
    session: FakeCastSession | null,
    sessionState: string,
    errorCode?: string
  ): void {
    this.emit('sessionstatechanged', { session, sessionState, errorCode })
  }
}

/** Bare data classes standing in for the `chrome.cast.media` request types. */
function buildChromeCastNamespace() {
  class Image {
    url: string
    width: number | null = null
    height: number | null = null
    constructor(url: string) {
      this.url = url
    }
  }
  class Volume {
    level: number | null
    muted: boolean | null
    constructor(level?: number, muted?: boolean) {
      this.level = level ?? null
      this.muted = muted ?? null
    }
  }
  class MediaInfo {
    contentId: string
    contentType: string
    constructor(contentId: string, contentType: string) {
      this.contentId = contentId
      this.contentType = contentType
    }
  }
  class LoadRequest {
    media: any
    constructor(media: any) {
      this.media = media
    }
  }
  class QueueItem {
    media: any
    constructor(media: any) {
      this.media = media
    }
  }
  class QueueLoadRequest {
    items: any[]
    constructor(items: any[]) {
      this.items = items
    }
  }
  class QueueInsertItemsRequest {
    items: any[]
    insertBefore: number | undefined
    constructor(items: any[]) {
      this.items = items
    }
  }
  class QueueReorderItemsRequest {
    itemIds: number[]
    insertBefore: number | undefined
    constructor(itemIds: number[]) {
      this.itemIds = itemIds
    }
  }
  class GetStatusRequest {}
  class PlayRequest {}
  class PauseRequest {}
  class StopRequest {}
  class SeekRequest {
    currentTime: number | undefined
    resumeState: string | undefined
  }
  class VolumeRequest {
    volume: any
    constructor(volume: any) {
      this.volume = volume
    }
  }
  class EditTracksInfoRequest {
    activeTrackIds: number[] | undefined
    textTrackStyle: any
    constructor(activeTrackIds?: number[], textTrackStyle?: any) {
      this.activeTrackIds = activeTrackIds
      this.textTrackStyle = textTrackStyle
    }
  }
  class TextTrackStyle {}
  class Track {
    trackId: number
    type: string
    constructor(trackId: number, type: string) {
      this.trackId = trackId
      this.type = type
    }
  }

  return {
    isAvailable: true,
    AutoJoinPolicy: {
      CUSTOM_CONTROLLER_SCOPED: 'custom_controller_scoped',
      TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
      ORIGIN_SCOPED: 'origin_scoped',
      PAGE_SCOPED: 'page_scoped',
    },
    Image,
    Volume,
    media: {
      DEFAULT_MEDIA_RECEIVER_APP_ID: 'CC1AD845',
      MediaInfo,
      LoadRequest,
      QueueItem,
      QueueLoadRequest,
      QueueInsertItemsRequest,
      QueueReorderItemsRequest,
      GetStatusRequest,
      PlayRequest,
      PauseRequest,
      StopRequest,
      SeekRequest,
      VolumeRequest,
      EditTracksInfoRequest,
      TextTrackStyle,
      Track,
    },
  }
}

function buildFrameworkNamespace(context: FakeCastContext) {
  return {
    CastContext: { getInstance: () => context },
    CastContextEventType: {
      CAST_STATE_CHANGED: 'caststatechanged',
      SESSION_STATE_CHANGED: 'sessionstatechanged',
    },
    CastState: {
      NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE',
      NOT_CONNECTED: 'NOT_CONNECTED',
      CONNECTING: 'CONNECTING',
      CONNECTED: 'CONNECTED',
    },
    SessionState: {
      NO_SESSION: 'NO_SESSION',
      SESSION_STARTING: 'SESSION_STARTING',
      SESSION_STARTED: 'SESSION_STARTED',
      SESSION_START_FAILED: 'SESSION_START_FAILED',
      SESSION_ENDING: 'SESSION_ENDING',
      SESSION_ENDED: 'SESSION_ENDED',
      SESSION_RESUMED: 'SESSION_RESUMED',
    },
    SessionEventType: {
      APPLICATION_STATUS_CHANGED: 'applicationstatuschanged',
      APPLICATION_METADATA_CHANGED: 'applicationmetadatachanged',
      ACTIVE_INPUT_STATE_CHANGED: 'activeinputstatechanged',
      VOLUME_CHANGED: 'volumechanged',
      MEDIA_SESSION: 'mediasession',
    },
  }
}

export interface InstalledFakeWebSdk {
  context: FakeCastContext
  chromeCast: ReturnType<typeof buildChromeCastNamespace>
  framework: ReturnType<typeof buildFrameworkNamespace>
  uninstall: () => void
}

/**
 * Install the fake SDK on `globalThis` (what the transport reads). Call
 * `uninstall()` in `afterEach` — it also drops any `__onGCastApiAvailable`
 * hook and `__RNGoogleCastOptions` the test left behind.
 */
export function installFakeWebSdk(): InstalledFakeWebSdk {
  const context = new FakeCastContext()
  const chromeCast = buildChromeCastNamespace()
  const framework = buildFrameworkNamespace(context)
  const g = globalThis as any
  g.chrome = { cast: chromeCast }
  g.cast = { framework }
  return {
    context,
    chromeCast,
    framework,
    uninstall: () => {
      delete g.chrome
      delete g.cast
      delete g.__onGCastApiAvailable
      delete g.__RNGoogleCastOptions
    },
  }
}

/** Remove any SDK globals/hooks without an install handle (defensive). */
export function clearWebSdkGlobals(): void {
  const g = globalThis as any
  delete g.chrome
  delete g.cast
  delete g.__onGCastApiAvailable
  delete g.__RNGoogleCastOptions
}
