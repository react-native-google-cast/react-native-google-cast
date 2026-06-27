package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaMetadata
import com.margelo.nitro.googlecast.MediaMetadataType
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import com.google.android.gms.cast.MediaMetadata as GckMediaMetadata

/**
 * Converts a generated [MediaMetadata] struct into a Google Cast [GckMediaMetadata].
 *
 * The reverse lives in `GckMediaMetadata+toMediaMetadata.kt`. Mapping rules (kept symmetric):
 * - `type` is mapped BY VALUE — our union order differs from GCK's `MEDIA_TYPE_*` constants.
 * - Standard fields use the predefined `GckMediaMetadata.KEY_*` keys with the GCK field's
 *   required value type (string / int / double / date). The three date keys are `Calendar`
 *   fields, so they are written with `putDate` from a parsed ISO-8601 string.
 * - `images` are appended via `addImage`.
 * - `customData` carries application-defined keys, written directly into the keyed bag
 *   (string → `putString`, number → `putDouble`); these must not collide with the standard
 *   keys, which the reverse converter treats as the only "standard" set.
 *
 * Note: GCK normalizes dates to ISO-8601 BASIC on read (`getDateAsString`), so date fields do
 * not round-trip byte-for-byte vs the ISO input — a known cross-platform reconciliation point.
 */
internal fun MediaMetadata.toGckMediaMetadata(): GckMediaMetadata {
  val gck = GckMediaMetadata(type.toGckMediaType())

  for (image in images ?: emptyArray()) {
    gck.addImage(image.toGckWebImage())
  }

  // String fields.
  title?.let { gck.putString(GckMediaMetadata.KEY_TITLE, it) }
  subtitle?.let { gck.putString(GckMediaMetadata.KEY_SUBTITLE, it) }
  artist?.let { gck.putString(GckMediaMetadata.KEY_ARTIST, it) }
  studio?.let { gck.putString(GckMediaMetadata.KEY_STUDIO, it) }
  albumTitle?.let { gck.putString(GckMediaMetadata.KEY_ALBUM_TITLE, it) }
  albumArtist?.let { gck.putString(GckMediaMetadata.KEY_ALBUM_ARTIST, it) }
  composer?.let { gck.putString(GckMediaMetadata.KEY_COMPOSER, it) }
  location?.let { gck.putString(GckMediaMetadata.KEY_LOCATION_NAME, it) }
  seriesTitle?.let { gck.putString(GckMediaMetadata.KEY_SERIES_TITLE, it) }

  // Integer fields.
  discNumber?.let { gck.putInt(GckMediaMetadata.KEY_DISC_NUMBER, it.toInt()) }
  trackNumber?.let { gck.putInt(GckMediaMetadata.KEY_TRACK_NUMBER, it.toInt()) }
  width?.let { gck.putInt(GckMediaMetadata.KEY_WIDTH, it.toInt()) }
  height?.let { gck.putInt(GckMediaMetadata.KEY_HEIGHT, it.toInt()) }
  episodeNumber?.let { gck.putInt(GckMediaMetadata.KEY_EPISODE_NUMBER, it.toInt()) }
  seasonNumber?.let { gck.putInt(GckMediaMetadata.KEY_SEASON_NUMBER, it.toInt()) }

  // Double fields.
  latitude?.let { gck.putDouble(GckMediaMetadata.KEY_LOCATION_LATITUDE, it) }
  longitude?.let { gck.putDouble(GckMediaMetadata.KEY_LOCATION_LONGITUDE, it) }

  // Date fields (Calendar-typed; parsed from ISO-8601 strings).
  releaseDate?.let { parseIso8601(it)?.let { c -> gck.putDate(GckMediaMetadata.KEY_RELEASE_DATE, c) } }
  creationDate?.let { parseIso8601(it)?.let { c -> gck.putDate(GckMediaMetadata.KEY_CREATION_DATE, c) } }
  broadcastDate?.let { parseIso8601(it)?.let { c -> gck.putDate(GckMediaMetadata.KEY_BROADCAST_DATE, c) } }

  // Application-defined custom keys.
  customData?.let { map ->
    for (key in map.getAllKeys()) {
      when {
        map.isString(key) -> gck.putString(key, map.getString(key))
        map.isDouble(key) -> gck.putDouble(key, map.getDouble(key))
        map.isInt64(key) -> gck.putDouble(key, map.getInt64(key).toDouble())
      }
    }
  }

  return gck
}

private fun MediaMetadataType.toGckMediaType(): Int =
  when (this) {
    MediaMetadataType.GENERIC -> GckMediaMetadata.MEDIA_TYPE_GENERIC
    MediaMetadataType.MOVIE -> GckMediaMetadata.MEDIA_TYPE_MOVIE
    MediaMetadataType.MUSICTRACK -> GckMediaMetadata.MEDIA_TYPE_MUSIC_TRACK
    MediaMetadataType.PHOTO -> GckMediaMetadata.MEDIA_TYPE_PHOTO
    MediaMetadataType.TVSHOW -> GckMediaMetadata.MEDIA_TYPE_TV_SHOW
    MediaMetadataType.USER -> GckMediaMetadata.MEDIA_TYPE_USER
  }

/**
 * Parses an ISO-8601 string into a `Calendar` (UTC), accepting both full date-times and
 * date-only forms. Returns `null` if neither parses.
 */
private fun parseIso8601(value: String): Calendar? {
  val patterns = arrayOf("yyyy-MM-dd'T'HH:mm:ss'Z'", "yyyy-MM-dd'T'HH:mm:ssXXX", "yyyy-MM-dd", "yyyyMMdd")
  for (pattern in patterns) {
    try {
      val format = SimpleDateFormat(pattern, Locale.US)
      format.timeZone = TimeZone.getTimeZone("UTC")
      val date = format.parse(value) ?: continue
      val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
      calendar.time = date
      return calendar
    } catch (_: java.text.ParseException) {
      continue
    }
  }
  return null
}
