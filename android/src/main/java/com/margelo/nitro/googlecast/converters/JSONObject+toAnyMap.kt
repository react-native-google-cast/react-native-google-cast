package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.core.AnyMap
import org.json.JSONObject

/**
 * Converts an [org.json.JSONObject] from Google Cast `customData` back into a Nitro [AnyMap].
 *
 * Reverse of `AnyMap+toJsonObject.kt`. Scalar JSON values map symmetrically to the
 * [AnyMap] setters: boolean → `setBoolean`, integral number → `setInt64`, other number →
 * `setDouble`, string → `setString`, JSON null → `setNull`. Nested JSON arrays/objects are
 * skipped (see the forward converter) so the partition stays symmetric.
 */
internal fun JSONObject.toAnyMap(): AnyMap {
  val map = AnyMap()
  val keys = keys()
  while (keys.hasNext()) {
    val key = keys.next()
    when (val value = get(key)) {
      JSONObject.NULL -> map.setNull(key)
      is Boolean -> map.setBoolean(key, value)
      is Int -> map.setInt64(key, value.toLong())
      is Long -> map.setInt64(key, value)
      is Number -> map.setDouble(key, value.toDouble())
      is String -> map.setString(key, value)
    }
  }
  return map
}
