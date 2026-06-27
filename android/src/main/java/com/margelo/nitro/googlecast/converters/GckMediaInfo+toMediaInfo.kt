package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaHlsSegmentFormat
import com.margelo.nitro.googlecast.MediaHlsVideoSegmentFormat
import com.margelo.nitro.googlecast.MediaInfo
import com.margelo.nitro.googlecast.MediaStreamType
import com.margelo.nitro.googlecast.MediaTrack
import com.google.android.gms.cast.MediaInfo as GckMediaInfo

/**
 * Converts a Google Cast [GckMediaInfo] into a generated [MediaInfo] struct.
 *
 * Reverse of `MediaInfo+toGckMediaInfo.kt`. Nested types delegate to their own converters.
 * GCK milliseconds become seconds; `UNKNOWN_DURATION` becomes `null`. `streamType` is mapped
 * BY VALUE (`STREAM_TYPE_NONE` collapses to [MediaStreamType.OTHER]); the HLS segment-format
 * strings map back to their enums (unknown strings become `null`).
 */
internal fun GckMediaInfo.toMediaInfo(): MediaInfo {
  val mappedTracks = mediaTracks?.map { it.toMediaTrack() }
  return MediaInfo(
    contentUrl = contentUrl ?: contentId ?: "",
    contentId = contentId,
    contentType = contentType,
    entity = entity,
    streamType = streamTypeOrNull(streamType),
    metadata = metadata?.toMediaMetadata(),
    streamDuration = if (streamDuration == GckMediaInfo.UNKNOWN_DURATION) null else streamDuration / 1000.0,
    mediaTracks = if (mappedTracks.isNullOrEmpty()) null else mappedTracks.toTypedArray<MediaTrack>(),
    textTrackStyle = textTrackStyle?.toTextTrackStyle(),
    hlsSegmentFormat = hlsSegmentFormatOrNull(hlsSegmentFormat),
    hlsVideoSegmentFormat = hlsVideoSegmentFormatOrNull(hlsVideoSegmentFormat),
    customData = customData?.toAnyMap()
  )
}

private fun streamTypeOrNull(value: Int): MediaStreamType? =
  when (value) {
    GckMediaInfo.STREAM_TYPE_BUFFERED -> MediaStreamType.BUFFERED
    GckMediaInfo.STREAM_TYPE_LIVE -> MediaStreamType.LIVE
    GckMediaInfo.STREAM_TYPE_NONE -> MediaStreamType.OTHER
    else -> null
  }

private fun hlsSegmentFormatOrNull(value: String?): MediaHlsSegmentFormat? =
  when (value) {
    "aac" -> MediaHlsSegmentFormat.AAC
    "ac3" -> MediaHlsSegmentFormat.AC3
    "e-ac3" -> MediaHlsSegmentFormat.E_AC3
    "fmp4" -> MediaHlsSegmentFormat.FMP4
    "mp3" -> MediaHlsSegmentFormat.MP3
    "ts" -> MediaHlsSegmentFormat.TS
    "ts_aac" -> MediaHlsSegmentFormat.TS_AAC
    else -> null
  }

private fun hlsVideoSegmentFormatOrNull(value: String?): MediaHlsVideoSegmentFormat? =
  when (value) {
    "fmp4" -> MediaHlsVideoSegmentFormat.FMP4
    "mpeg2_ts" -> MediaHlsVideoSegmentFormat.MPEG2_TS
    else -> null
  }
