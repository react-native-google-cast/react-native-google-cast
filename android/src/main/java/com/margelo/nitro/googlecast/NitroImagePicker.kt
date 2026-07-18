package com.margelo.nitro.googlecast

import com.google.android.gms.cast.MediaMetadata
import com.google.android.gms.cast.framework.media.ImageHints
import com.google.android.gms.cast.framework.media.ImagePicker
import com.google.android.gms.common.images.WebImage

/**
 * v4-parity default image picker (Decision 3), the Android sibling of the
 * Swift `NitroImagePicker`. A one-line shim over the pure
 * [CastOptionsDefaults.pickImage] heuristic, overriding the **non-deprecated**
 * `onPickImage(MediaMetadata, ImageHints)` overload (the `(MediaMetadata, Int)`
 * one is the deprecated pre-ImageHints form).
 */
internal class NitroImagePicker : ImagePicker() {
  override fun onPickImage(mediaMetadata: MediaMetadata?, hints: ImageHints): WebImage? {
    return CastOptionsDefaults.pickImage(mediaMetadata?.images ?: emptyList(), hints.type)
  }
}
