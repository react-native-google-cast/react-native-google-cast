package com.margelo.nitro.googlecast.converters

import android.net.Uri
import com.margelo.nitro.googlecast.WebImage
import com.google.android.gms.common.images.WebImage as GckWebImage

/**
 * Converts a generated [WebImage] struct into a Google Cast [GckWebImage].
 *
 * Part of the per-platform struct↔GCK converter layer (Phase 2 / T1). The reverse
 * direction lives in `GckWebImage+toWebImage.kt`. GCK image dimensions are required,
 * non-negative ints, so absent width/height default to `0`.
 */
internal fun WebImage.toGckWebImage(): GckWebImage {
  return GckWebImage(
    Uri.parse(url),
    (width ?: 0.0).toInt(),
    (height ?: 0.0).toInt()
  )
}
