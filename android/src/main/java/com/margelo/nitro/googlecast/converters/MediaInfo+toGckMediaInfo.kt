package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaHlsSegmentFormat
import com.margelo.nitro.googlecast.MediaHlsVideoSegmentFormat
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaStreamType
import com.google.android.gms.cast.MediaInfo as GckMediaInfo

/**
 * Converts a generated [MediaInfo] struct into a Google Cast [GckMediaInfo].
 *
 * The reverse lives in `GckMediaInfo+toMediaInfo.kt`. Nested structs delegate to their own
 * converters. `streamType` is mapped BY VALUE; `streamDuration` is seconds in the struct /
 * milliseconds (`long`) in GCK. The HLS segment formats are `enum`s in the struct but plain
 * cast-protocol `String`s in GCK Android.
 */
internal fun MediaInfo.toGckMediaInfo(): GckMediaInfo {
  // GCK's `MediaInfo.Builder` has no `setContentId`; contentId is a constructor
  // argument — and it must always be supplied. `contentId` falls back to
  // `contentUrl` (the documented default on `MediaInfo.contentId`, and what v4
  // did: `RNGCMediaInfo.fromJson`). The Default Media Receiver keys off
  // contentId, so a MediaInfo built without one is accepted by `loadMedia` and
  // then fails on the receiver with `idleReason: error` — which looks like a
  // playback/codec problem and is not one.
  val builder = GckMediaInfo.Builder(contentId ?: contentUrl)
  builder.setContentUrl(contentUrl)
  contentType?.let { builder.setContentType(it) }
  entity?.let { builder.setEntity(it) }
  // Defaults to BUFFERED, matching the Chrome sender SDK (whose
  // `chrome.cast.media.MediaInfo` constructor sets BUFFERED) so an identical
  // MediaLoadRequest behaves the same on all three platforms. GCK's builder
  // would otherwise leave STREAM_TYPE_NONE, which receivers may reject.
  // Deliberate change from v4, which also left it NONE.
  builder.setStreamType((streamType ?: MediaStreamType.BUFFERED).toGckStreamType())
  metadata?.let { builder.setMetadata(it.toGckMediaMetadata()) }
  streamDuration?.let { builder.setStreamDuration((it * 1000).toLong()) }
  mediaTracks?.let { tracks -> builder.setMediaTracks(tracks.map { it.toGckMediaTrack() }) }
  textTrackStyle?.let { builder.setTextTrackStyle(it.toGckTextTrackStyle()) }
  hlsSegmentFormat?.let { builder.setHlsSegmentFormat(it.toGckHlsSegmentFormat()) }
  hlsVideoSegmentFormat?.let { builder.setHlsVideoSegmentFormat(it.toGckHlsVideoSegmentFormat()) }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

private fun MediaStreamType.toGckStreamType(): Int =
  when (this) {
    MediaStreamType.BUFFERED -> GckMediaInfo.STREAM_TYPE_BUFFERED
    MediaStreamType.LIVE -> GckMediaInfo.STREAM_TYPE_LIVE
    MediaStreamType.OTHER -> GckMediaInfo.STREAM_TYPE_NONE
  }

private fun MediaHlsSegmentFormat.toGckHlsSegmentFormat(): String =
  when (this) {
    MediaHlsSegmentFormat.AAC -> "aac"
    MediaHlsSegmentFormat.AC3 -> "ac3"
    MediaHlsSegmentFormat.E_AC3 -> "e-ac3"
    MediaHlsSegmentFormat.FMP4 -> "fmp4"
    MediaHlsSegmentFormat.MP3 -> "mp3"
    MediaHlsSegmentFormat.TS -> "ts"
    MediaHlsSegmentFormat.TS_AAC -> "ts_aac"
  }

private fun MediaHlsVideoSegmentFormat.toGckHlsVideoSegmentFormat(): String =
  when (this) {
    MediaHlsVideoSegmentFormat.FMP4 -> "fmp4"
    MediaHlsVideoSegmentFormat.MPEG2_TS -> "mpeg2_ts"
  }
