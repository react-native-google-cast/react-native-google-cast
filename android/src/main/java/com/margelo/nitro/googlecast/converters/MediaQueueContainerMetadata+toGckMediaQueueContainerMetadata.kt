package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.MediaQueueContainerMetadata
import com.margelo.nitro.googlecast.MediaQueueContainerType
import com.google.android.gms.cast.MediaQueueContainerMetadata as GckMediaQueueContainerMetadata

/**
 * Converts a generated [MediaQueueContainerMetadata] struct into a Google Cast
 * [GckMediaQueueContainerMetadata].
 *
 * The reverse lives in `GckMediaQueueContainerMetadata+toMediaQueueContainerMetadata.kt`.
 * `containerType` is mapped BY VALUE. `containerDuration` is seconds (`double`) on both sides.
 */
internal fun MediaQueueContainerMetadata.toGckMediaQueueContainerMetadata(): GckMediaQueueContainerMetadata {
  val builder = GckMediaQueueContainerMetadata.Builder()
  containerType?.let {
    val gckType = when (it) {
      MediaQueueContainerType.GENERIC -> GckMediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_GENERIC
      MediaQueueContainerType.AUDIOBOOK -> GckMediaQueueContainerMetadata.MEDIA_QUEUE_CONTAINER_TYPE_AUDIO_BOOK
    }
    builder.setContainerType(gckType)
  }
  title?.let { builder.setTitle(it) }
  containerDuration?.let { builder.setContainerDuration(it) }
  containerImages?.let { images -> builder.setContainerImages(images.map { it.toGckWebImage() }) }
  sections?.let { metadatas -> builder.setSections(metadatas.map { it.toGckMediaMetadata() }) }
  return builder.build()
}
