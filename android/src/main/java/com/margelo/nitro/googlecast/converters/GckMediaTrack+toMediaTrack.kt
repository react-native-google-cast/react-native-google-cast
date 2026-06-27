package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaTrack
import com.margelo.nitro.googlecast.MediaTrackSubtype
import com.margelo.nitro.googlecast.MediaTrackType
import com.google.android.gms.cast.MediaTrack as GckMediaTrack

/**
 * Converts a Google Cast [GckMediaTrack] into a generated [MediaTrack] struct.
 *
 * Reverse of `MediaTrack+toGckMediaTrack.kt`. `type` and `subtype` are mapped BY VALUE; the
 * GCK sentinels `SUBTYPE_NONE` / `SUBTYPE_UNKNOWN` become `null`. `TYPE_UNKNOWN` (which our
 * required union cannot represent) falls back to [MediaTrackType.AUDIO].
 */
internal fun GckMediaTrack.toMediaTrack(): MediaTrack {
  val mappedType = when (type) {
    GckMediaTrack.TYPE_AUDIO -> MediaTrackType.AUDIO
    GckMediaTrack.TYPE_TEXT -> MediaTrackType.TEXT
    GckMediaTrack.TYPE_VIDEO -> MediaTrackType.VIDEO
    else -> MediaTrackType.AUDIO
  }
  val mappedSubtype = when (subtype) {
    GckMediaTrack.SUBTYPE_CAPTIONS -> MediaTrackSubtype.CAPTIONS
    GckMediaTrack.SUBTYPE_CHAPTERS -> MediaTrackSubtype.CHAPTERS
    GckMediaTrack.SUBTYPE_DESCRIPTIONS -> MediaTrackSubtype.DESCRIPTIONS
    GckMediaTrack.SUBTYPE_METADATA -> MediaTrackSubtype.METADATA
    GckMediaTrack.SUBTYPE_SUBTITLES -> MediaTrackSubtype.SUBTITLES
    else -> null
  }
  return MediaTrack(
    id = id.toDouble(),
    type = mappedType,
    contentId = contentId,
    contentType = contentType,
    language = language,
    name = name,
    subtype = mappedSubtype,
    customData = customData?.toAnyMap()
  )
}
