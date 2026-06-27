package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaTrack
import com.margelo.nitro.googlecast.MediaTrackSubtype
import com.margelo.nitro.googlecast.MediaTrackType
import com.google.android.gms.cast.MediaTrack as GckMediaTrack

/**
 * Converts a generated [MediaTrack] struct into a Google Cast [GckMediaTrack].
 *
 * The reverse lives in `GckMediaTrack+toMediaTrack.kt`. `type` and `subtype` are mapped BY
 * VALUE (our union order differs from GCK's `TYPE_*` / `SUBTYPE_*` constants). GCK's builder
 * requires an id (`long`) and type up front; the subtype is only set when present.
 */
internal fun MediaTrack.toGckMediaTrack(): GckMediaTrack {
  val gckType = when (type) {
    MediaTrackType.AUDIO -> GckMediaTrack.TYPE_AUDIO
    MediaTrackType.TEXT -> GckMediaTrack.TYPE_TEXT
    MediaTrackType.VIDEO -> GckMediaTrack.TYPE_VIDEO
  }
  val builder = GckMediaTrack.Builder(id.toLong(), gckType)
  contentId?.let { builder.setContentId(it) }
  contentType?.let { builder.setContentType(it) }
  language?.let { builder.setLanguage(it) }
  name?.let { builder.setName(it) }
  subtype?.let { builder.setSubtype(it.toGckSubtype()) }
  customData?.let { builder.setCustomData(it.toJsonObject()) }
  return builder.build()
}

private fun MediaTrackSubtype.toGckSubtype(): Int =
  when (this) {
    MediaTrackSubtype.CAPTIONS -> GckMediaTrack.SUBTYPE_CAPTIONS
    MediaTrackSubtype.CHAPTERS -> GckMediaTrack.SUBTYPE_CHAPTERS
    MediaTrackSubtype.DESCRIPTIONS -> GckMediaTrack.SUBTYPE_DESCRIPTIONS
    MediaTrackSubtype.METADATA -> GckMediaTrack.SUBTYPE_METADATA
    MediaTrackSubtype.SUBTITLES -> GckMediaTrack.SUBTYPE_SUBTITLES
  }
