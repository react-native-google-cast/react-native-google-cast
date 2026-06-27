package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.VideoHdrType
import com.margelo.nitro.googlecast.VideoInfo
import com.google.android.gms.cast.VideoInfo as GckVideoInfo

/**
 * Converts a Google Cast [GckVideoInfo] into a generated [VideoInfo] struct.
 *
 * Reverse of `VideoInfo+toGckVideoInfo.kt`. HDR type is mapped BY VALUE; `HDR_TYPE_UNKNOWN`
 * becomes `null`. GCK has no analogue for our union beyond DV/HDR/SDR, and it adds
 * `HDR_TYPE_HDR10` which our union does not model — HDR10 collapses to [VideoHdrType.HDR]
 * (reconciliation point for the parity pass).
 */
internal fun GckVideoInfo.toVideoInfo(): VideoInfo {
  val mappedHdr = when (hdrType) {
    GckVideoInfo.HDR_TYPE_DV -> VideoHdrType.DV
    GckVideoInfo.HDR_TYPE_HDR -> VideoHdrType.HDR
    GckVideoInfo.HDR_TYPE_HDR10 -> VideoHdrType.HDR
    GckVideoInfo.HDR_TYPE_SDR -> VideoHdrType.SDR
    else -> null
  }
  return VideoInfo(
    hdrType = mappedHdr,
    width = width.toDouble(),
    height = height.toDouble()
  )
}
