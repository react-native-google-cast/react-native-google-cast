package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.core.AnyMap
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.json.JSONObject

/**
 * Shared assertion helpers for the instrumented converter parity suite.
 *
 * AnyMap comparison is lossy-tolerant: JSON numbers may round-trip as Long (setInt64) or
 * Double (setDouble); the comparison checks numeric equality with a small tolerance.
 * String values use exact equality.
 */
internal object ConverterAssertions {

  fun assertAnyMapEquals(actual: AnyMap?, expected: AnyMap?, ctx: String) {
    if (expected == null) {
      assertNull("$ctx: expected null customData", actual)
      return
    }
    assertNotNull("$ctx: expected non-null customData", actual)
    actual ?: return
    val actualKeys = actual.getAllKeys().toSet()
    val expectedKeys = expected.getAllKeys().toSet()
    assertEquals("$ctx: customData keys", expectedKeys, actualKeys)
    for (key in expectedKeys.intersect(actualKeys)) {
      when {
        expected.isString(key) ->
          assertEquals("$ctx customData[$key]", expected.getString(key), actual.getString(key))
        expected.isBoolean(key) ->
          assertEquals("$ctx customData[$key]", expected.getBoolean(key), actual.getBoolean(key))
        expected.isDouble(key) ->
          assertEquals("$ctx customData[$key]", expected.getDouble(key), actual.getDouble(key), 1e-6)
        expected.isInt64(key) ->
          assertEquals("$ctx customData[$key]", expected.getInt64(key), actual.getInt64(key))
      }
    }
  }

  /** Builds an AnyMap from a JSONObject (flat scalars only, matching the corpus format). */
  fun anyMapFromJson(json: JSONObject?): AnyMap? {
    if (json == null) return null
    return json.toAnyMap().takeIf { it.getAllKeys().isNotEmpty() }
  }
}
