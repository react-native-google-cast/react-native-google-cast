package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.common.images.WebImage as GckWebImage

/**
 * Converts a Google Cast [GckWebImage] into a generated [WebImage] struct.
 *
 * Reverse of `WebImage+toGckWebImage.kt`. GCK always carries concrete (possibly `0`)
 * dimensions, so width/height are emitted as present numbers.
 */
internal fun GckWebImage.toWebImage(): WebImage {
  return WebImage(
    url = url.toString(),
    width = width.toDouble(),
    height = height.toDouble()
  )
}
