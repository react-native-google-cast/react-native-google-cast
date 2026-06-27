package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaMetadata
import com.margelo.nitro.googlecast.MediaQueueContainerMetadata
import com.margelo.nitro.googlecast.MediaQueueContainerType
import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.cast.MediaQueueContainerMetadata as GckMediaQueueContainerMetadata

/**
 * Converts a Google Cast [GckMediaQueueContainerMetadata] into a generated
 * [MediaQueueContainerMetadata] struct.
 *
 * Reverse of `MediaQueueContainerMetadata+toGckMediaQueueContainerMetadata.kt`.
 * `containerType` is mapped BY VALUE. Empty image / section lists normalize to `null`.
 */
internal fun GckMediaQueueContainerMetadata.toMediaQueueContainerMetadata(): MediaQueueContainerMetadata {
  val mappedType = when (containerType) {
    GckMediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_GENERIC -> MediaQueueContainerType.GENERIC
    GckMediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_AUDIO_BOOK -> MediaQueueContainerType.AUDIOBOOK
    else -> null
  }
  val images = containerImages?.map { it.toWebImage() }
  val sections = sections?.map { it.toMediaMetadata() }
  return MediaQueueContainerMetadata(
    containerType = mappedType,
    title = title,
    containerDuration = containerDuration,
    containerImages = if (images.isNullOrEmpty()) null else images.toTypedArray<WebImage>(),
    sections = if (sections.isNullOrEmpty()) null else sections.toTypedArray<MediaMetadata>()
  )
}
