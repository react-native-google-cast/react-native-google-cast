package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ApplicationMetadata
import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.cast.ApplicationMetadata as GckApplicationMetadata

/**
 * Converts a Google Cast [GckApplicationMetadata] into a generated [ApplicationMetadata] struct.
 *
 * This is the real, app-facing direction. The forward direction in
 * `ApplicationMetadata+toGckApplicationMetadata.kt` exists only for the test seam and uses
 * reflection because `ApplicationMetadata` has no public constructor on Android.
 *
 * Note: `getImages()` is deprecated and returns `null` in play-services-cast 22.x, so `images`
 * is always empty on Android (iOS/Android reconciliation point for the parity pass).
 */
internal fun GckApplicationMetadata.toApplicationMetadata(): ApplicationMetadata {
  val mappedImages = images?.map { it.toWebImage() } ?: emptyList<WebImage>()
  return ApplicationMetadata(
    applicationId = applicationId ?: "",
    images = mappedImages.toTypedArray(),
    name = name ?: "",
    namespaces = supportedNamespaces?.toTypedArray() ?: emptyArray()
  )
}
