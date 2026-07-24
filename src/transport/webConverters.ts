/**
 * Bidirectional converters between the library's platform-agnostic TS types
 * and the Google Cast Web Sender SDK's `chrome.cast.*` / `cast.framework.*`
 * shapes. Web twin of the native converter files
 * (`ios/NitroGoogleCast/converters/`, `android/.../converters/`).
 *
 * Mapping decisions cite the Web Sender reference
 * (https://developers.google.com/cast/docs/reference/web_sender/) — enum wire
 * values are written as literals from those docs rather than read off the
 * ambient `@types` enums (whose declared ordering is not authoritative).
 */
import type { AnyMap } from 'react-native-nitro-modules'
import type { Device, DeviceCapability } from '../types/Device'
import type { CastState } from '../types/CastState'
import type { SessionInfo } from './types'
import type { ActiveInputState } from '../types/ActiveInputState'
import type { ApplicationMetadata } from '../types/ApplicationMetadata'
import type { WebImage } from '../types/WebImage'
import type { MediaStatus } from '../types/MediaStatus'
import type { MediaInfo } from '../types/MediaInfo'
import type { MediaMetadata } from '../types/MediaMetadata'
import type { MediaMetadataType } from '../types/MediaMetadataType'
import type { MediaPlayerState } from '../types/MediaPlayerState'
import type { MediaPlayerIdleReason } from '../types/MediaPlayerIdleReason'
import type { MediaRepeatMode } from '../types/MediaRepeatMode'
import type { MediaStreamType } from '../types/MediaStreamType'
import type { MediaHlsSegmentFormat } from '../types/MediaHlsSegmentFormat'
import type { MediaHlsVideoSegmentFormat } from '../types/MediaHlsVideoSegmentFormat'
import type {
  MediaTrack,
  MediaTrackSubtype,
  MediaTrackType,
} from '../types/MediaTrack'
import type {
  TextTrackStyle,
  TextTrackEdgeType,
  TextTrackFontGenericFamily,
  TextTrackFontStyle,
  TextTrackWindowType,
} from '../types/TextTrackStyle'
import type { MediaQueueItem } from '../types/MediaQueueItem'
import type { MediaLiveSeekableRange } from '../types/MediaLiveSeekableRange'
import type { MediaLoadRequest } from '../types/MediaLoadRequest'
import type { VideoInfo, VideoHdrType } from '../types/VideoInfo'
import type { MediaQueueData } from '../types/MediaQueueData'
import type { MediaQueueType } from '../types/MediaQueueType'
import type { MediaQueueContainerMetadata } from '../types/MediaQueueContainerMetadata'
import type { MediaQueueContainerType } from '../types/MediaQueueContainerType'
import type { ChromeCastNamespace } from './webSdk'

// ---------------------------------------------------------------------------
// enum value tables (web wire value ⇄ TS union)
// ---------------------------------------------------------------------------

/** https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.CastState */
const CAST_STATE_FROM_WEB: Record<string, CastState> = {
  NO_DEVICES_AVAILABLE: 'noDevicesAvailable',
  NOT_CONNECTED: 'notConnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast#.Capability */
const CAPABILITY_FROM_WEB: Record<string, DeviceCapability> = {
  video_out: 'VideoOut',
  audio_out: 'AudioOut',
  video_in: 'VideoIn',
  audio_in: 'AudioIn',
  multizone_group: 'MultizoneGroup',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.PlayerState */
const PLAYER_STATE_FROM_WEB: Record<string, MediaPlayerState> = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  BUFFERING: 'buffering',
  // The web sender never reports the native-only `loading` state.
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.IdleReason */
const IDLE_REASON_FROM_WEB: Record<string, MediaPlayerIdleReason> = {
  CANCELLED: 'cancelled',
  INTERRUPTED: 'interrupted',
  FINISHED: 'finished',
  ERROR: 'error',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.RepeatMode */
const REPEAT_MODE_FROM_WEB: Record<string, MediaRepeatMode> = {
  REPEAT_OFF: 'off',
  REPEAT_ALL: 'all',
  REPEAT_SINGLE: 'single',
  REPEAT_ALL_AND_SHUFFLE: 'allAndShuffle',
}
const REPEAT_MODE_TO_WEB: Record<MediaRepeatMode, string> = {
  off: 'REPEAT_OFF',
  all: 'REPEAT_ALL',
  single: 'REPEAT_SINGLE',
  allAndShuffle: 'REPEAT_ALL_AND_SHUFFLE',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.StreamType */
const STREAM_TYPE_FROM_WEB: Record<string, MediaStreamType> = {
  BUFFERED: 'buffered',
  LIVE: 'live',
  OTHER: 'other',
}
const STREAM_TYPE_TO_WEB: Record<MediaStreamType, string> = {
  buffered: 'BUFFERED',
  live: 'LIVE',
  other: 'OTHER',
}

/**
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.MetadataType
 * Numeric wire values (0=GENERIC, 1=MOVIE, 2=TV_SHOW, 3=MUSIC_TRACK, 4=PHOTO).
 * `user` has no web equivalent — it is sent as GENERIC with the custom fields
 * spread onto the metadata object (the receiver sees them as extra keys).
 */
const METADATA_TYPE_FROM_WEB: Record<number, MediaMetadataType> = {
  0: 'generic',
  1: 'movie',
  2: 'tvShow',
  3: 'musicTrack',
  4: 'photo',
}
const METADATA_TYPE_TO_WEB: Record<MediaMetadataType, number> = {
  generic: 0,
  movie: 1,
  tvShow: 2,
  musicTrack: 3,
  photo: 4,
  user: 0,
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TrackType */
const TRACK_TYPE_FROM_WEB: Record<string, MediaTrackType> = {
  AUDIO: 'audio',
  TEXT: 'text',
  VIDEO: 'video',
}
const TRACK_TYPE_TO_WEB: Record<MediaTrackType, string> = {
  audio: 'AUDIO',
  text: 'TEXT',
  video: 'VIDEO',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TextTrackType */
const TRACK_SUBTYPE_FROM_WEB: Record<string, MediaTrackSubtype> = {
  SUBTITLES: 'subtitles',
  CAPTIONS: 'captions',
  DESCRIPTIONS: 'descriptions',
  CHAPTERS: 'chapters',
  METADATA: 'metadata',
}
const TRACK_SUBTYPE_TO_WEB: Record<MediaTrackSubtype, string> = {
  subtitles: 'SUBTITLES',
  captions: 'CAPTIONS',
  descriptions: 'DESCRIPTIONS',
  chapters: 'CHAPTERS',
  metadata: 'METADATA',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.QueueType */
const QUEUE_TYPE_TO_WEB: Record<MediaQueueType, string> = {
  album: 'ALBUM',
  audioBook: 'AUDIOBOOK',
  liveTv: 'LIVE_TV',
  movie: 'MOVIE',
  playlist: 'PLAYLIST',
  radioStation: 'RADIO_STATION',
  podcastSeries: 'PODCAST_SERIES',
  tvSeries: 'TV_SERIES',
  videoPlaylist: 'VIDEO_PLAYLIST',
}

/**
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.ContainerType
 * Numeric wire values (0 = GENERIC_CONTAINER, 1 = AUDIOBOOK_CONTAINER).
 */
const CONTAINER_TYPE_TO_WEB: Record<MediaQueueContainerType, number> = {
  generic: 0,
  audioBook: 1,
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TextTrackEdgeType */
const EDGE_TYPE_FROM_WEB: Record<string, TextTrackEdgeType> = {
  NONE: 'none',
  OUTLINE: 'outline',
  DROP_SHADOW: 'dropShadow',
  RAISED: 'raised',
  DEPRESSED: 'depressed',
}
const EDGE_TYPE_TO_WEB: Record<TextTrackEdgeType, string> = {
  none: 'NONE',
  outline: 'OUTLINE',
  dropShadow: 'DROP_SHADOW',
  raised: 'RAISED',
  depressed: 'DEPRESSED',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TextTrackWindowType */
const WINDOW_TYPE_FROM_WEB: Record<string, TextTrackWindowType> = {
  NONE: 'none',
  NORMAL: 'normal',
  ROUNDED_CORNERS: 'rounded',
}
const WINDOW_TYPE_TO_WEB: Record<TextTrackWindowType, string> = {
  none: 'NONE',
  normal: 'NORMAL',
  rounded: 'ROUNDED_CORNERS',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TextTrackFontGenericFamily */
const FONT_FAMILY_FROM_WEB: Record<string, TextTrackFontGenericFamily> = {
  SANS_SERIF: 'sansSerif',
  MONOSPACED_SANS_SERIF: 'monoSansSerif',
  SERIF: 'serif',
  MONOSPACED_SERIF: 'monoSerif',
  CASUAL: 'casual',
  CURSIVE: 'cursive',
  SMALL_CAPITALS: 'smallCaps',
}
const FONT_FAMILY_TO_WEB: Record<TextTrackFontGenericFamily, string> = {
  sansSerif: 'SANS_SERIF',
  monoSansSerif: 'MONOSPACED_SANS_SERIF',
  serif: 'SERIF',
  monoSerif: 'MONOSPACED_SERIF',
  casual: 'CASUAL',
  cursive: 'CURSIVE',
  smallCaps: 'SMALL_CAPITALS',
}

/** https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.TextTrackFontStyle */
const FONT_STYLE_FROM_WEB: Record<string, TextTrackFontStyle> = {
  NORMAL: 'normal',
  BOLD: 'bold',
  BOLD_ITALIC: 'boldItalic',
  ITALIC: 'italic',
}
const FONT_STYLE_TO_WEB: Record<TextTrackFontStyle, string> = {
  normal: 'NORMAL',
  bold: 'BOLD',
  boldItalic: 'BOLD_ITALIC',
  italic: 'ITALIC',
}

/**
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.HlsSegmentFormat
 *
 * The wire values ARE these lowercase strings. The sender reference lists
 * only the uppercase enum *member names*; the shipped SDK defines
 * `chrome.cast.media.HlsSegmentFormat = {AAC: "aac", AC3: "ac3", MP3: "mp3",
 * TS: "ts", TS_AAC: "ts_aac", E_AC3: "e_ac3", FMP4: "fmp4"}` (verify with
 * `Object.entries(chrome.cast.media.HlsSegmentFormat)` in a Cast-enabled
 * browser), matching the Web Receiver's documented
 * `cast.framework.messages.HlsSegmentFormat` values
 * (https://developers.google.com/cast/docs/reference/web_receiver/cast.framework.messages#.HlsSegmentFormat).
 */
const HLS_SEGMENT_TO_WEB: Record<MediaHlsSegmentFormat, string> = {
  'AAC': 'aac',
  'AC3': 'ac3',
  'E-AC3': 'e_ac3',
  'FMP4': 'fmp4',
  'MP3': 'mp3',
  'TS': 'ts',
  'TS_AAC': 'ts_aac',
}
const HLS_SEGMENT_FROM_WEB: Record<string, MediaHlsSegmentFormat> =
  Object.fromEntries(
    Object.entries(HLS_SEGMENT_TO_WEB).map(([k, v]) => [
      v,
      k as MediaHlsSegmentFormat,
    ])
  )

/**
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.HlsVideoSegmentFormat
 * Same member-name-vs-value convention as {@link HLS_SEGMENT_TO_WEB}: the
 * shipped SDK defines `{MPEG2_TS: "mpeg2_ts", FMP4: "fmp4"}`.
 */
const HLS_VIDEO_TO_WEB: Record<MediaHlsVideoSegmentFormat, string> = {
  'FMP4': 'fmp4',
  'MPEG2-TS': 'mpeg2_ts',
}

/**
 * `chrome.cast.media.HdrType` wire values (the shipped SDK defines
 * `{SDR: "sdr", HDR: "hdr", DV: "dv"}`) → the shared {@link VideoHdrType}.
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.HdrType
 */
const HDR_TYPE_FROM_WEB: Record<string, VideoHdrType> = {
  sdr: 'SDR',
  hdr: 'HDR',
  dv: 'DV',
}
const HLS_VIDEO_FROM_WEB: Record<string, MediaHlsVideoSegmentFormat> =
  Object.fromEntries(
    Object.entries(HLS_VIDEO_TO_WEB).map(([k, v]) => [
      v,
      k as MediaHlsVideoSegmentFormat,
    ])
  )

// ---------------------------------------------------------------------------
// runtime shapes the ambient @types don't fully declare
// ---------------------------------------------------------------------------

/**
 * Fields `chrome.cast.media.MediaInfo` carries at runtime that the ambient
 * types omit (see the MediaInformation reference — contentUrl, entity, HLS
 * segment formats are all documented sender fields).
 */
interface ExtendedWebMediaInfo extends chrome.cast.media.MediaInfo {
  contentUrl?: string
  entity?: string
  hlsSegmentFormat?: string
  hlsVideoSegmentFormat?: string
}

/**
 * `chrome.cast.media.ContainerMetadata` shape
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.ContainerMetadata)
 * — sent as a plain field bag, like metadata (the SDK class is a bare
 * container; the ambient types don't declare it).
 */
interface WebContainerMetadata {
  containerType?: number
  title?: string
  containerDuration?: number
  containerImages?: chrome.cast.Image[]
  sections?: WebMetadataBag[]
}

/**
 * `chrome.cast.media.QueueData` shape
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.QueueData)
 * — sent as a plain field bag on `LoadRequest.queueData` (the ambient types
 * don't declare the class).
 */
interface WebQueueData {
  id?: string
  name?: string
  entity?: string
  queueType?: string
  repeatMode?: string
  containerMetadata?: WebContainerMetadata
  items?: chrome.cast.media.QueueItem[]
  startIndex?: number
  startTime?: number
}

/**
 * Runtime `LoadRequest` fields the ambient types omit: credentials and
 * `queueData`
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.LoadRequest).
 */
interface ExtendedWebLoadRequest extends chrome.cast.media.LoadRequest {
  credentials?: string
  credentialsType?: string
  queueData?: WebQueueData
}

/** Runtime `QueueItem` fields the ambient types omit. */
interface ExtendedWebQueueItem extends chrome.cast.media.QueueItem {
  playbackDuration?: number | null
}

/**
 * `chrome.cast.media.VideoInformation` shape
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.VideoInformation)
 * — the ambient types don't declare it.
 */
interface WebVideoInformation {
  width?: number
  height?: number
  hdrType?: string
}

/**
 * Runtime `Media` fields the ambient types omit: `videoInfo`
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.Media#videoInfo).
 */
interface ExtendedWebMedia extends chrome.cast.media.Media {
  videoInfo?: WebVideoInformation
}

/** Flat metadata field bag as it crosses the wire (both directions). */
interface WebMetadataBag {
  metadataType?: number
  images?: Array<{ url: string; width?: number | null; height?: number | null }>
  title?: string
  subtitle?: string
  artist?: string
  releaseDate?: string
  studio?: string
  albumName?: string
  albumArtist?: string
  composer?: string
  discNumber?: number
  trackNumber?: number
  creationDateTime?: string
  location?: string
  latitude?: number
  longitude?: number
  width?: number
  height?: number
  originalAirdate?: string
  episode?: number
  season?: number
  seriesTitle?: string
  [key: string]: unknown
}

/**
 * The wire keys consumed by {@link MediaMetadata} struct fields. Anything
 * else on an incoming metadata bag is application-defined and collected into
 * `customData` — same standard-vs-custom partition the native converters use
 * (`GCKMediaMetadata+toMediaMetadata.swift`).
 */
const WEB_METADATA_STANDARD_KEYS = new Set([
  'metadataType',
  'images',
  'title',
  'subtitle',
  'artist',
  'releaseDate',
  'studio',
  'albumName',
  'albumArtist',
  'composer',
  'discNumber',
  'trackNumber',
  'creationDateTime',
  'location',
  'latitude',
  'longitude',
  'width',
  'height',
  'originalAirdate',
  'episode',
  'season',
  'seriesTitle',
])

/**
 * Deprecated aliases the web SDK's metadata classes still declare (e.g.
 * `type`, `releaseYear`, `episodeTitle`) — neither standard fields nor
 * application custom data.
 */
const WEB_METADATA_DEPRECATED_KEYS = new Set([
  'type',
  'releaseYear',
  'episodeTitle',
  'seasonNumber',
  'episodeNumber',
  'artistName',
  'songName',
])

// ---------------------------------------------------------------------------
// incoming (web SDK → TS types)
// ---------------------------------------------------------------------------

/** Map a `cast.framework.CastState` string to the shared {@link CastState}. */
export function toCastState(state: string): CastState {
  return CAST_STATE_FROM_WEB[state] ?? 'noDevicesAvailable'
}

function toWebImages(
  images: chrome.cast.Image[] | undefined | null
): WebImage[] {
  return (images ?? []).map((image) => {
    const result: WebImage = { url: image.url }
    if (typeof image.width === 'number') result.width = image.width
    if (typeof image.height === 'number') result.height = image.height
    return result
  })
}

/**
 * `chrome.cast.Receiver` → {@link Device}. The web sender exposes only the
 * connected receiver (never a discoverable list) and reports no model name,
 * protocol version, or IP address — those stay empty
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.Receiver).
 */
export function toDevice(receiver: chrome.cast.Receiver): Device {
  return {
    deviceId: receiver.label ?? '',
    friendlyName: receiver.friendlyName ?? '',
    capabilities: (receiver.capabilities ?? [])
      .map((capability) => CAPABILITY_FROM_WEB[capability])
      .filter((capability): capability is DeviceCapability => !!capability),
    deviceVersion: '',
    ipAddress: '',
    modelName: '',
    icons: [],
  }
}

function toActiveInputState(state: number): ActiveInputState {
  if (state === 1) return 'active'
  if (state === 0) return 'inactive'
  return 'unknown'
}

function toApplicationMetadata(
  metadata: cast.framework.ApplicationMetadata | null | undefined
): ApplicationMetadata | undefined {
  if (!metadata) return undefined
  return {
    applicationId: metadata.applicationId ?? '',
    name: metadata.name ?? '',
    images: toWebImages(metadata.images),
    namespaces: metadata.namespaces ? [...metadata.namespaces] : [],
  }
}

/**
 * Build the full {@link SessionInfo} from a live `cast.framework.CastSession`.
 * `standbyState` is always `unknown` — the web sender has no CEC standby
 * surface. Volume/mute/active-input come from the session's synchronous
 * getters (https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastSession).
 */
export function toSessionInfo(
  session: cast.framework.CastSession
): SessionInfo {
  const info: SessionInfo = {
    sessionId: session.getSessionId() ?? '',
    device: toDevice(session.getCastDevice()),
    deviceVolume: session.getVolume() ?? 0,
    deviceMuted: session.isMute() ?? false,
    standbyState: 'unknown',
    activeInputState: toActiveInputState(session.getActiveInputState()),
  }
  const applicationMetadata = toApplicationMetadata(
    session.getApplicationMetadata()
  )
  if (applicationMetadata) info.applicationMetadata = applicationMetadata
  const applicationStatus = session.getApplicationStatus()
  if (applicationStatus) info.applicationStatus = applicationStatus
  return info
}

function toMediaMetadata(raw: unknown): MediaMetadata | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const bag = raw as WebMetadataBag
  const metadata: MediaMetadata = {
    type: METADATA_TYPE_FROM_WEB[bag.metadataType ?? 0] ?? 'generic',
  }
  if (bag.images)
    metadata.images = toWebImages(bag.images as chrome.cast.Image[])
  if (bag.title !== undefined) metadata.title = bag.title
  if (bag.subtitle !== undefined) metadata.subtitle = bag.subtitle
  if (bag.artist !== undefined) metadata.artist = bag.artist
  if (bag.releaseDate !== undefined) metadata.releaseDate = bag.releaseDate
  if (bag.studio !== undefined) metadata.studio = bag.studio
  if (bag.albumName !== undefined) metadata.albumTitle = bag.albumName
  if (bag.albumArtist !== undefined) metadata.albumArtist = bag.albumArtist
  if (bag.composer !== undefined) metadata.composer = bag.composer
  if (bag.discNumber !== undefined) metadata.discNumber = bag.discNumber
  if (bag.trackNumber !== undefined) metadata.trackNumber = bag.trackNumber
  if (bag.creationDateTime !== undefined)
    metadata.creationDate = bag.creationDateTime
  if (bag.location !== undefined) metadata.location = bag.location
  if (bag.latitude !== undefined) metadata.latitude = bag.latitude
  if (bag.longitude !== undefined) metadata.longitude = bag.longitude
  if (bag.width !== undefined) metadata.width = bag.width
  if (bag.height !== undefined) metadata.height = bag.height
  if (bag.originalAirdate !== undefined)
    metadata.broadcastDate = bag.originalAirdate
  if (bag.episode !== undefined) metadata.episodeNumber = bag.episode
  if (bag.season !== undefined) metadata.seasonNumber = bag.season
  if (bag.seriesTitle !== undefined) metadata.seriesTitle = bag.seriesTitle
  // Application-defined keys → customData, for EVERY metadata type (native
  // parity: the GCK converters partition standard vs custom keys the same
  // way). Deprecated SDK aliases are neither standard nor custom.
  const customData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(bag)) {
    if (value === undefined || value === null) continue
    if (typeof value === 'function') continue
    if (
      WEB_METADATA_STANDARD_KEYS.has(key) ||
      WEB_METADATA_DEPRECATED_KEYS.has(key)
    ) {
      continue
    }
    customData[key] = value
  }
  if (Object.keys(customData).length > 0) {
    metadata.customData = customData as AnyMap
  }
  return metadata
}

function toMediaTrack(track: chrome.cast.media.Track): MediaTrack {
  const result: MediaTrack = {
    id: track.trackId,
    type: TRACK_TYPE_FROM_WEB[track.type] ?? 'text',
  }
  if (track.trackContentId) result.contentId = track.trackContentId
  if (track.trackContentType) result.contentType = track.trackContentType
  if (track.language) result.language = track.language
  if (track.name) result.name = track.name
  if (track.subtype && TRACK_SUBTYPE_FROM_WEB[track.subtype]) {
    result.subtype = TRACK_SUBTYPE_FROM_WEB[track.subtype]
  }
  if (track.customData) result.customData = track.customData as AnyMap
  return result
}

function toTextTrackStyle(
  style: chrome.cast.media.TextTrackStyle | null | undefined
): TextTrackStyle | undefined {
  if (!style) return undefined
  const result: TextTrackStyle = {}
  if (style.backgroundColor) result.backgroundColor = style.backgroundColor
  if (style.edgeColor) result.edgeColor = style.edgeColor
  if (style.edgeType && EDGE_TYPE_FROM_WEB[style.edgeType]) {
    result.edgeType = EDGE_TYPE_FROM_WEB[style.edgeType]
  }
  if (style.fontFamily) result.fontFamily = style.fontFamily
  if (
    style.fontGenericFamily &&
    FONT_FAMILY_FROM_WEB[style.fontGenericFamily]
  ) {
    result.fontGenericFamily = FONT_FAMILY_FROM_WEB[style.fontGenericFamily]
  }
  if (typeof style.fontScale === 'number') result.fontScale = style.fontScale
  if (style.fontStyle && FONT_STYLE_FROM_WEB[style.fontStyle]) {
    result.fontStyle = FONT_STYLE_FROM_WEB[style.fontStyle]
  }
  if (style.foregroundColor) result.foregroundColor = style.foregroundColor
  if (style.windowColor) result.windowColor = style.windowColor
  if (typeof style.windowRoundedCornerRadius === 'number') {
    result.windowCornerRadius = style.windowRoundedCornerRadius
  }
  if (style.windowType && WINDOW_TYPE_FROM_WEB[style.windowType]) {
    result.windowType = WINDOW_TYPE_FROM_WEB[style.windowType]
  }
  if (style.customData) result.customData = style.customData as AnyMap
  return result
}

/** `chrome.cast.media.MediaInfo` → {@link MediaInfo}. */
export function toMediaInfo(info: chrome.cast.media.MediaInfo): MediaInfo {
  const extended = info as ExtendedWebMediaInfo
  const result: MediaInfo = {
    contentUrl: extended.contentUrl ?? info.contentId ?? '',
  }
  if (info.contentId) result.contentId = info.contentId
  if (info.contentType) result.contentType = info.contentType
  if (extended.entity) result.entity = extended.entity
  if (info.streamType && STREAM_TYPE_FROM_WEB[info.streamType]) {
    result.streamType = STREAM_TYPE_FROM_WEB[info.streamType]
  }
  const metadata = toMediaMetadata(info.metadata)
  if (metadata) result.metadata = metadata
  if (typeof info.duration === 'number') result.streamDuration = info.duration
  if (info.tracks?.length) result.mediaTracks = info.tracks.map(toMediaTrack)
  const textTrackStyle = toTextTrackStyle(info.textTrackStyle)
  if (textTrackStyle) result.textTrackStyle = textTrackStyle
  if (
    extended.hlsSegmentFormat &&
    HLS_SEGMENT_FROM_WEB[extended.hlsSegmentFormat]
  ) {
    result.hlsSegmentFormat = HLS_SEGMENT_FROM_WEB[extended.hlsSegmentFormat]
  }
  if (
    extended.hlsVideoSegmentFormat &&
    HLS_VIDEO_FROM_WEB[extended.hlsVideoSegmentFormat]
  ) {
    result.hlsVideoSegmentFormat =
      HLS_VIDEO_FROM_WEB[extended.hlsVideoSegmentFormat]
  }
  if (info.customData) result.customData = info.customData as AnyMap
  return result
}

function toQueueItem(item: chrome.cast.media.QueueItem): MediaQueueItem {
  const extended = item as ExtendedWebQueueItem
  const result: MediaQueueItem = {
    mediaInfo: item.media ? toMediaInfo(item.media) : { contentUrl: '' },
  }
  if (typeof item.itemId === 'number') result.itemId = item.itemId
  if (item.activeTrackIds) {
    result.activeTrackIds = item.activeTrackIds.map((id) => Number(id))
  }
  if (typeof item.autoplay === 'boolean') result.autoplay = item.autoplay
  if (typeof extended.playbackDuration === 'number') {
    result.playbackDuration = extended.playbackDuration
  }
  if (typeof item.preloadTime === 'number')
    result.preloadTime = item.preloadTime
  if (typeof item.startTime === 'number') result.startTime = item.startTime
  if (item.customData) result.customData = item.customData as AnyMap
  return result
}

function toLiveSeekableRange(
  range: chrome.cast.media.LiveSeekableRange | undefined
): MediaLiveSeekableRange | undefined {
  if (
    !range ||
    typeof range.start !== 'number' ||
    typeof range.end !== 'number'
  )
    return undefined
  return {
    startTime: range.start,
    endTime: range.end,
    isMovingWindow: range.isMovingWindow ?? false,
    isLiveDone: range.isLiveDone ?? false,
  }
}

/**
 * `chrome.cast.media.Media` → the shared {@link MediaStatus}. The stream
 * position uses `getEstimatedTime()` (the SDK's locally-extrapolated
 * position — the raw `currentTime` field is deprecated:
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.Media#getEstimatedTime).
 * `videoInfo` comes from `Media.videoInfo`
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.Media#videoInfo)
 * when the receiver reports it.
 */
export function toMediaStatus(media: chrome.cast.media.Media): MediaStatus {
  const status: MediaStatus = {
    streamPosition:
      typeof media.getEstimatedTime === 'function'
        ? media.getEstimatedTime()
        : 0,
    playbackRate:
      typeof media.playbackRate === 'number' ? media.playbackRate : 1,
    volume: media.volume?.level ?? 1,
    isMuted: media.volume?.muted ?? false,
    queueItems: (media.items ?? []).map(toQueueItem),
  }
  if (media.media) status.mediaInfo = toMediaInfo(media.media)
  if (media.playerState && PLAYER_STATE_FROM_WEB[media.playerState]) {
    status.playerState = PLAYER_STATE_FROM_WEB[media.playerState]
  }
  if (media.idleReason && IDLE_REASON_FROM_WEB[media.idleReason]) {
    status.idleReason = IDLE_REASON_FROM_WEB[media.idleReason]
  }
  if (media.activeTrackIds) status.activeTrackIds = [...media.activeTrackIds]
  const liveSeekableRange = toLiveSeekableRange(media.liveSeekableRange)
  if (liveSeekableRange) status.liveSeekableRange = liveSeekableRange
  if (typeof media.currentItemId === 'number') {
    status.currentItemId = media.currentItemId
  }
  if (typeof media.loadingItemId === 'number') {
    status.loadingItemId = media.loadingItemId
  }
  if (typeof media.preloadedItemId === 'number') {
    status.preloadedItemId = media.preloadedItemId
  }
  if (media.repeatMode && REPEAT_MODE_FROM_WEB[media.repeatMode]) {
    status.queueRepeatMode = REPEAT_MODE_FROM_WEB[media.repeatMode]
  }
  const videoInfo = toVideoInfo((media as ExtendedWebMedia).videoInfo)
  if (videoInfo) status.videoInfo = videoInfo
  if (media.customData) status.customData = media.customData as AnyMap
  return status
}

/**
 * `chrome.cast.media.VideoInformation` (`{width, height, hdrType}`, see
 * https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.VideoInformation)
 * → the shared {@link VideoInfo}.
 */
function toVideoInfo(
  info: WebVideoInformation | undefined
): VideoInfo | undefined {
  if (!info) return undefined
  const result: VideoInfo = {}
  if (typeof info.width === 'number') result.width = info.width
  if (typeof info.height === 'number') result.height = info.height
  if (info.hdrType && HDR_TYPE_FROM_WEB[info.hdrType]) {
    result.hdrType = HDR_TYPE_FROM_WEB[info.hdrType]
  }
  return Object.keys(result).length > 0 ? result : undefined
}

// ---------------------------------------------------------------------------
// outgoing (TS types → web SDK)
// ---------------------------------------------------------------------------

function fromWebImage(
  image: WebImage,
  chromeCast: ChromeCastNamespace
): chrome.cast.Image {
  const result = new chromeCast.Image(image.url)
  if (image.width !== undefined) result.width = image.width
  if (image.height !== undefined) result.height = image.height
  return result
}

/**
 * Flat {@link MediaMetadata} → the web metadata field bag. Sent as a plain
 * object: the SDK's per-type metadata classes are bare field containers that
 * serialize to exactly this JSON. `customData` keys are written under their
 * own names for **every** metadata type (native parity — the GCK converters
 * do the same); `user` maps to GENERIC (no web equivalent) so its custom
 * fields simply ride along.
 */
function fromMediaMetadata(
  metadata: MediaMetadata,
  chromeCast: ChromeCastNamespace
): WebMetadataBag {
  const bag: WebMetadataBag = {
    metadataType: METADATA_TYPE_TO_WEB[metadata.type] ?? 0,
  }
  if (metadata.images) {
    bag.images = metadata.images.map((image) => fromWebImage(image, chromeCast))
  }
  if (metadata.title !== undefined) bag.title = metadata.title
  if (metadata.subtitle !== undefined) bag.subtitle = metadata.subtitle
  if (metadata.artist !== undefined) bag.artist = metadata.artist
  if (metadata.releaseDate !== undefined) bag.releaseDate = metadata.releaseDate
  if (metadata.studio !== undefined) bag.studio = metadata.studio
  if (metadata.albumTitle !== undefined) bag.albumName = metadata.albumTitle
  if (metadata.albumArtist !== undefined) bag.albumArtist = metadata.albumArtist
  if (metadata.composer !== undefined) bag.composer = metadata.composer
  if (metadata.discNumber !== undefined) bag.discNumber = metadata.discNumber
  if (metadata.trackNumber !== undefined) bag.trackNumber = metadata.trackNumber
  if (metadata.creationDate !== undefined) {
    bag.creationDateTime = metadata.creationDate
  }
  if (metadata.location !== undefined) bag.location = metadata.location
  if (metadata.latitude !== undefined) bag.latitude = metadata.latitude
  if (metadata.longitude !== undefined) bag.longitude = metadata.longitude
  if (metadata.width !== undefined) bag.width = metadata.width
  if (metadata.height !== undefined) bag.height = metadata.height
  if (metadata.broadcastDate !== undefined) {
    bag.originalAirdate = metadata.broadcastDate
  }
  if (metadata.episodeNumber !== undefined) bag.episode = metadata.episodeNumber
  if (metadata.seasonNumber !== undefined) bag.season = metadata.seasonNumber
  if (metadata.seriesTitle !== undefined) bag.seriesTitle = metadata.seriesTitle
  // Application-defined keys ride along for every type (written last, like
  // the native converter — apps must not collide with standard keys). The
  // `metadataType` discriminant is re-asserted so it can never be clobbered.
  if (metadata.customData) {
    Object.assign(bag, metadata.customData)
    bag.metadataType = METADATA_TYPE_TO_WEB[metadata.type] ?? 0
  }
  return bag
}

function fromMediaTrack(
  track: MediaTrack,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.Track {
  const result = new chromeCast.media.Track(
    track.id,
    TRACK_TYPE_TO_WEB[track.type] as chrome.cast.media.TrackType
  )
  if (track.contentId !== undefined) result.trackContentId = track.contentId
  if (track.contentType !== undefined)
    result.trackContentType = track.contentType
  if (track.language !== undefined) result.language = track.language
  if (track.name !== undefined) result.name = track.name
  if (track.subtype !== undefined) {
    result.subtype = TRACK_SUBTYPE_TO_WEB[
      track.subtype
    ] as chrome.cast.media.TextTrackType
  }
  if (track.customData !== undefined) result.customData = track.customData
  return result
}

/** {@link TextTrackStyle} → `chrome.cast.media.TextTrackStyle`. */
export function fromTextTrackStyle(
  style: TextTrackStyle,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.TextTrackStyle {
  const result = new chromeCast.media.TextTrackStyle()
  if (style.backgroundColor !== undefined) {
    result.backgroundColor = style.backgroundColor
  }
  if (style.edgeColor !== undefined) result.edgeColor = style.edgeColor
  if (style.edgeType !== undefined) {
    result.edgeType = EDGE_TYPE_TO_WEB[
      style.edgeType
    ] as chrome.cast.media.TextTrackEdgeType
  }
  if (style.fontFamily !== undefined) result.fontFamily = style.fontFamily
  if (style.fontGenericFamily !== undefined) {
    result.fontGenericFamily = FONT_FAMILY_TO_WEB[
      style.fontGenericFamily
    ] as chrome.cast.media.TextTrackFontGenericFamily
  }
  if (style.fontScale !== undefined) result.fontScale = style.fontScale
  if (style.fontStyle !== undefined) {
    result.fontStyle = FONT_STYLE_TO_WEB[
      style.fontStyle
    ] as chrome.cast.media.TextTrackFontStyle
  }
  if (style.foregroundColor !== undefined) {
    result.foregroundColor = style.foregroundColor
  }
  if (style.windowColor !== undefined) result.windowColor = style.windowColor
  if (style.windowCornerRadius !== undefined) {
    result.windowRoundedCornerRadius = style.windowCornerRadius
  }
  if (style.windowType !== undefined) {
    result.windowType = WINDOW_TYPE_TO_WEB[
      style.windowType
    ] as chrome.cast.media.TextTrackWindowType
  }
  if (style.customData !== undefined) result.customData = style.customData
  return result
}

/** {@link MediaInfo} → `chrome.cast.media.MediaInfo`. */
export function fromMediaInfo(
  info: MediaInfo,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.MediaInfo {
  const result = new chromeCast.media.MediaInfo(
    info.contentId ?? info.contentUrl,
    info.contentType ?? ''
  ) as ExtendedWebMediaInfo
  result.contentUrl = info.contentUrl
  if (info.entity !== undefined) result.entity = info.entity
  if (info.streamType !== undefined) {
    result.streamType = STREAM_TYPE_TO_WEB[
      info.streamType
    ] as chrome.cast.media.StreamType
  }
  if (info.metadata !== undefined) {
    result.metadata = fromMediaMetadata(info.metadata, chromeCast)
  }
  if (info.streamDuration !== undefined) result.duration = info.streamDuration
  if (info.mediaTracks !== undefined) {
    result.tracks = info.mediaTracks.map((track) =>
      fromMediaTrack(track, chromeCast)
    )
  }
  if (info.textTrackStyle !== undefined) {
    result.textTrackStyle = fromTextTrackStyle(info.textTrackStyle, chromeCast)
  }
  if (info.hlsSegmentFormat !== undefined) {
    result.hlsSegmentFormat = HLS_SEGMENT_TO_WEB[info.hlsSegmentFormat]
  }
  if (info.hlsVideoSegmentFormat !== undefined) {
    result.hlsVideoSegmentFormat = HLS_VIDEO_TO_WEB[info.hlsVideoSegmentFormat]
  }
  if (info.customData !== undefined) result.customData = info.customData
  return result
}

/**
 * {@link MediaQueueContainerMetadata} → the web `ContainerMetadata` field bag
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.ContainerMetadata).
 */
function fromContainerMetadata(
  metadata: MediaQueueContainerMetadata,
  chromeCast: ChromeCastNamespace
): WebContainerMetadata {
  const result: WebContainerMetadata = {
    containerType: CONTAINER_TYPE_TO_WEB[metadata.containerType ?? 'generic'],
  }
  if (metadata.title !== undefined) result.title = metadata.title
  if (metadata.containerDuration !== undefined) {
    result.containerDuration = metadata.containerDuration
  }
  if (metadata.containerImages !== undefined) {
    result.containerImages = metadata.containerImages.map((image) =>
      fromWebImage(image, chromeCast)
    )
  }
  if (metadata.sections !== undefined) {
    result.sections = metadata.sections.map((section) =>
      fromMediaMetadata(section, chromeCast)
    )
  }
  return result
}

/**
 * {@link MediaQueueData} → the web `QueueData` field bag carried on
 * `LoadRequest.queueData`
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.QueueData).
 * Every shared field has a web slot: `id`/`name`/`entity`/`startIndex`/
 * `startTime` map by name, `type` → `queueType`, `repeatMode` and
 * `containerMetadata` through their value tables, `items` through
 * {@link fromQueueItem}.
 */
export function fromMediaQueueData(
  queueData: MediaQueueData,
  chromeCast: ChromeCastNamespace
): WebQueueData {
  const result: WebQueueData = {}
  if (queueData.id !== undefined) result.id = queueData.id
  if (queueData.name !== undefined) result.name = queueData.name
  if (queueData.entity !== undefined) result.entity = queueData.entity
  if (queueData.type !== undefined) {
    result.queueType = QUEUE_TYPE_TO_WEB[queueData.type]
  }
  if (queueData.repeatMode !== undefined) {
    result.repeatMode = REPEAT_MODE_TO_WEB[queueData.repeatMode]
  }
  if (queueData.containerMetadata !== undefined) {
    result.containerMetadata = fromContainerMetadata(
      queueData.containerMetadata,
      chromeCast
    )
  }
  if (queueData.items !== undefined) {
    result.items = queueData.items.map((item) =>
      fromQueueItem(item, chromeCast)
    )
  }
  if (queueData.startIndex !== undefined) {
    result.startIndex = queueData.startIndex
  }
  if (queueData.startTime !== undefined) result.startTime = queueData.startTime
  return result
}

/**
 * {@link MediaLoadRequest} → `chrome.cast.media.LoadRequest`. A `queueData`
 * payload rides on `LoadRequest.queueData` in full — the modern web queue
 * load
 * (https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media.LoadRequest).
 * (`CastTransportApi.queueLoad`'s narrower surface still goes through
 * {@link fromQueueLoadRequest}.)
 */
export function fromMediaLoadRequest(
  request: MediaLoadRequest,
  mediaInfo: MediaInfo,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.LoadRequest {
  const result = new chromeCast.media.LoadRequest(
    fromMediaInfo(mediaInfo, chromeCast)
  ) as ExtendedWebLoadRequest
  if (request.queueData !== undefined) {
    result.queueData = fromMediaQueueData(request.queueData, chromeCast)
  }
  if (request.autoplay !== undefined) result.autoplay = request.autoplay
  if (request.startTime !== undefined) result.currentTime = request.startTime
  if (request.playbackRate !== undefined) {
    result.playbackRate = request.playbackRate
  }
  if (request.credentials !== undefined)
    result.credentials = request.credentials
  if (request.credentialsType !== undefined) {
    result.credentialsType = request.credentialsType
  }
  if (request.customData !== undefined) result.customData = request.customData
  return result
}

/** {@link MediaQueueItem} → `chrome.cast.media.QueueItem`. */
export function fromQueueItem(
  item: MediaQueueItem,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.QueueItem {
  const result = new chromeCast.media.QueueItem(
    fromMediaInfo(item.mediaInfo, chromeCast)
  ) as ExtendedWebQueueItem
  if (item.itemId !== undefined) result.itemId = item.itemId
  if (item.activeTrackIds !== undefined) {
    result.activeTrackIds = [...item.activeTrackIds]
  }
  if (item.autoplay !== undefined) result.autoplay = item.autoplay
  if (item.playbackDuration !== undefined) {
    result.playbackDuration = item.playbackDuration
  }
  if (item.preloadTime !== undefined) result.preloadTime = item.preloadTime
  if (item.startTime !== undefined) result.startTime = item.startTime
  if (item.customData !== undefined) result.customData = item.customData
  return result
}

/** Build the `QueueLoadRequest` for {@link CastTransportApi.queueLoad}. */
export function fromQueueLoadRequest(
  items: MediaQueueItem[],
  startIndex: number,
  repeatMode: MediaRepeatMode,
  customData: AnyMap | undefined,
  chromeCast: ChromeCastNamespace
): chrome.cast.media.QueueLoadRequest {
  const result = new chromeCast.media.QueueLoadRequest(
    items.map((item) => fromQueueItem(item, chromeCast))
  )
  result.startIndex = startIndex
  result.repeatMode = REPEAT_MODE_TO_WEB[
    repeatMode
  ] as chrome.cast.media.RepeatMode
  if (customData !== undefined) result.customData = customData
  return result
}

/** {@link MediaRepeatMode} → the web `RepeatMode` wire value. */
export function fromRepeatMode(
  repeatMode: MediaRepeatMode
): chrome.cast.media.RepeatMode {
  return REPEAT_MODE_TO_WEB[repeatMode] as chrome.cast.media.RepeatMode
}
