package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.VideoHdrType
import com.margelo.nitro.googlecast.VideoInfo
import com.google.android.gms.cast.VideoInfo as GckVideoInfo

/**
 * Converts a generated [VideoInfo] struct into a Google Cast [GckVideoInfo].
 *
 * The reverse lives in `GckVideoInfo+toVideoInfo.kt`. The HDR type is mapped BY VALUE (our
 * union order differs from GCK's `HDR_TYPE_*` constants). GCK width/height are required ints,
 * so absent dimensions default to `0`.
 */
internal fun VideoInfo.toGckVideoInfo(): GckVideoInfo {
  val builder = GckVideoInfo.Builder()
    .setWidth((width ?: 0.0).toInt())
    .setHeight((height ?: 0.0).toInt())
  val gckHdr = when (hdrType) {
    VideoHdrType.DV -> GckVideoInfo.HDR_TYPE_DV
    VideoHdrType.HDR -> GckVideoInfo.HDR_TYPE_HDR
    VideoHdrType.SDR -> GckVideoInfo.HDR_TYPE_SDR
    null -> GckVideoInfo.HDR_TYPE_UNKNOWN
  }
  builder.setHdrType(gckHdr)
  return builder.build()
}
