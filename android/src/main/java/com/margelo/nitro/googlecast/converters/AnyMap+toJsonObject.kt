package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.core.AnyMap
import org.json.JSONObject

/**
 * Converts a Nitro [AnyMap] into an [org.json.JSONObject] for Google Cast `customData`.
 *
 * Shared by every converter whose generated struct carries an `AnyMap? customData`
 * (MediaInfo, MediaTrack, MediaMetadata, MediaQueueItem, MediaLoadRequest, MediaSeekOptions,
 * MediaStatus, TextTrackStyle). GCK stores application-defined data as a `JSONObject`.
 *
 * Only the scalar value kinds Nitro's [AnyMap] exposes are emitted: string, boolean, int64
 * (as `Long`), double, and null. Nested arrays/objects are not represented in `customData`
 * round-trips yet (parity-pass concern); they are skipped rather than guessed.
 */
internal fun AnyMap.toJsonObject(): JSONObject {
  val json = JSONObject()
  for (key in getAllKeys()) {
    when {
      isNull(key) -> json.put(key, JSONObject.NULL)
      isString(key) -> json.put(key, getString(key))
      isBoolean(key) -> json.put(key, getBoolean(key))
      isInt64(key) -> json.put(key, getInt64(key))
      isDouble(key) -> json.put(key, getDouble(key))
    }
  }
  return json
}
