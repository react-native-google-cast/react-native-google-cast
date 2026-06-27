package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ApplicationMetadata
import com.google.android.gms.cast.ApplicationMetadata as GckApplicationMetadata

/**
 * Converts a generated [ApplicationMetadata] struct into a Google Cast [GckApplicationMetadata].
 *
 * Test-seam only. `ApplicationMetadata` has no public constructor or builder on Android, so
 * this uses its package-private 10-arg constructor via reflection. The constructor's
 * arg→field mapping was verified from bytecode: arg1 = applicationId, arg2 = name, arg4 =
 * supported namespaces (arg3, the first `List`, is discarded by the constructor). The
 * remaining args are framework-internal and passed as `null`.
 *
 * `images` cannot be represented (`getImages()` is deprecated and returns `null` in
 * play-services-cast 22.x), so it is dropped here and reported empty by the reverse converter.
 * The app-facing direction is `GckApplicationMetadata+toApplicationMetadata.kt`.
 */
internal fun ApplicationMetadata.toGckApplicationMetadata(): GckApplicationMetadata {
  val constructor = GckApplicationMetadata::class.java.declaredConstructors
    .first { it.parameterTypes.size == 10 }
  constructor.isAccessible = true
  return constructor.newInstance(
    applicationId,            // arg1 -> applicationId
    name,                     // arg2 -> name
    null,                     // arg3 -> discarded List
    namespaces.toList(),      // arg4 -> supported namespaces
    null,                     // arg5 -> senderAppIdentifier
    null,                     // arg6 -> icon Uri
    null,                     // arg7
    null,                     // arg8
    null,                     // arg9
    null                      // arg10
  ) as GckApplicationMetadata
}
