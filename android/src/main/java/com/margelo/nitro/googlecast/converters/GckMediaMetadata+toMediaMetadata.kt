package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.core.AnyMap
import com.margelo.nitro.googlecast.MediaMetadata
import com.margelo.nitro.googlecast.MediaMetadataType
import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.cast.MediaMetadata as GckMediaMetadata

/**
 * Converts a Google Cast [GckMediaMetadata] into a generated [MediaMetadata] struct.
 *
 * Reverse of `MediaMetadata+toGckMediaMetadata.kt`. Each standard field is read with the GCK
 * field's typed getter guarded by `containsKey` so a genuinely absent field stays `null`
 * (int/double getters otherwise default to `0`).
 *
 * Standard-vs-custom key rule: a key is "standard" iff it is one of the predefined `KEY_*`
 * constants that maps to a struct field (see [STANDARD_KEYS]). Every other key in `keySet()`
 * is application-defined and is collected into `customData`. GCK Android exposes no generic
 * value getter for arbitrary keys, so custom values are read best-effort as string then
 * double — full fidelity is deferred to the instrumented parity pass.
 */
internal fun GckMediaMetadata.toMediaMetadata(): MediaMetadata {
  val mappedImages = images?.map { it.toWebImage() } ?: emptyList<WebImage>()

  return MediaMetadata(
    type = mediaMetadataTypeFromGck(mediaType),
    images = if (mappedImages.isEmpty()) null else mappedImages.toTypedArray(),
    title = stringIfPresent(GckMediaMetadata.KEY_TITLE),
    subtitle = stringIfPresent(GckMediaMetadata.KEY_SUBTITLE),
    artist = stringIfPresent(GckMediaMetadata.KEY_ARTIST),
    releaseDate = dateStringIfPresent(GckMediaMetadata.KEY_RELEASE_DATE),
    studio = stringIfPresent(GckMediaMetadata.KEY_STUDIO),
    albumTitle = stringIfPresent(GckMediaMetadata.KEY_ALBUM_TITLE),
    albumArtist = stringIfPresent(GckMediaMetadata.KEY_ALBUM_ARTIST),
    composer = stringIfPresent(GckMediaMetadata.KEY_COMPOSER),
    discNumber = intIfPresent(GckMediaMetadata.KEY_DISC_NUMBER),
    trackNumber = intIfPresent(GckMediaMetadata.KEY_TRACK_NUMBER),
    creationDate = dateStringIfPresent(GckMediaMetadata.KEY_CREATION_DATE),
    location = stringIfPresent(GckMediaMetadata.KEY_LOCATION_NAME),
    latitude = doubleIfPresent(GckMediaMetadata.KEY_LOCATION_LATITUDE),
    longitude = doubleIfPresent(GckMediaMetadata.KEY_LOCATION_LONGITUDE),
    width = intIfPresent(GckMediaMetadata.KEY_WIDTH),
    height = intIfPresent(GckMediaMetadata.KEY_HEIGHT),
    broadcastDate = dateStringIfPresent(GckMediaMetadata.KEY_BROADCAST_DATE),
    episodeNumber = intIfPresent(GckMediaMetadata.KEY_EPISODE_NUMBER),
    seasonNumber = intIfPresent(GckMediaMetadata.KEY_SEASON_NUMBER),
    seriesTitle = stringIfPresent(GckMediaMetadata.KEY_SERIES_TITLE),
    customData = extractCustomData()
  )
}

private fun GckMediaMetadata.stringIfPresent(key: String): String? =
  if (containsKey(key)) getString(key) else null

private fun GckMediaMetadata.dateStringIfPresent(key: String): String? =
  if (containsKey(key)) getDateAsString(key) else null

private fun GckMediaMetadata.intIfPresent(key: String): Double? =
  if (containsKey(key)) getInt(key).toDouble() else null

private fun GckMediaMetadata.doubleIfPresent(key: String): Double? =
  if (containsKey(key)) getDouble(key) else null

private val STANDARD_KEYS: Set<String> = setOf(
  GckMediaMetadata.KEY_TITLE, GckMediaMetadata.KEY_SUBTITLE, GckMediaMetadata.KEY_ARTIST,
  GckMediaMetadata.KEY_RELEASE_DATE, GckMediaMetadata.KEY_STUDIO, GckMediaMetadata.KEY_ALBUM_TITLE,
  GckMediaMetadata.KEY_ALBUM_ARTIST, GckMediaMetadata.KEY_COMPOSER, GckMediaMetadata.KEY_DISC_NUMBER,
  GckMediaMetadata.KEY_TRACK_NUMBER, GckMediaMetadata.KEY_CREATION_DATE, GckMediaMetadata.KEY_LOCATION_NAME,
  GckMediaMetadata.KEY_LOCATION_LATITUDE, GckMediaMetadata.KEY_LOCATION_LONGITUDE, GckMediaMetadata.KEY_WIDTH,
  GckMediaMetadata.KEY_HEIGHT, GckMediaMetadata.KEY_BROADCAST_DATE, GckMediaMetadata.KEY_EPISODE_NUMBER,
  GckMediaMetadata.KEY_SEASON_NUMBER, GckMediaMetadata.KEY_SERIES_TITLE
)

private fun GckMediaMetadata.extractCustomData(): AnyMap? {
  val customKeys = keySet().filter { it !in STANDARD_KEYS }
  if (customKeys.isEmpty()) {
    return null
  }
  val map = AnyMap()
  for (key in customKeys) {
    val asString = getString(key)
    if (asString != null) {
      map.setString(key, asString)
    } else {
      map.setDouble(key, getDouble(key))
    }
  }
  return map
}

private fun mediaMetadataTypeFromGck(value: Int): MediaMetadataType =
  when (value) {
    GckMediaMetadata.MEDIA_TYPE_GENERIC -> MediaMetadataType.GENERIC
    GckMediaMetadata.MEDIA_TYPE_MOVIE -> MediaMetadataType.MOVIE
    GckMediaMetadata.MEDIA_TYPE_MUSIC_TRACK -> MediaMetadataType.MUSICTRACK
    GckMediaMetadata.MEDIA_TYPE_PHOTO -> MediaMetadataType.PHOTO
    GckMediaMetadata.MEDIA_TYPE_TV_SHOW -> MediaMetadataType.TVSHOW
    else -> if (value >= GckMediaMetadata.MEDIA_TYPE_USER) MediaMetadataType.USER else MediaMetadataType.GENERIC
  }
