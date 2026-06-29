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
      val expectedNumber = numericValue(expected, key)
      val actualNumber = numericValue(actual, key)
      when {
        expectedNumber != null || actualNumber != null -> {
          assertNotNull("$ctx customData[$key]: expected numeric", expectedNumber)
          assertNotNull("$ctx customData[$key]: actual numeric", actualNumber)
          assertEquals("$ctx customData[$key]", expectedNumber!!, actualNumber!!, 1e-6)
        }
        expected.isString(key) ->
          assertEquals("$ctx customData[$key]", expected.getString(key), actual.getString(key))
        expected.isBoolean(key) ->
          assertEquals("$ctx customData[$key]", expected.getBoolean(key), actual.getBoolean(key))
      }
    }
  }

  /** Normalizes a numeric AnyMap entry (Int64 or Double) to Double; null if not numeric. */
  private fun numericValue(map: AnyMap, key: String): Double? = when {
    map.isDouble(key) -> map.getDouble(key)
    map.isInt64(key) -> map.getInt64(key).toDouble()
    else -> null
  }

  /** Builds an AnyMap from a JSONObject (flat scalars only, matching the corpus format). */
  fun anyMapFromJson(json: JSONObject?): AnyMap? {
    if (json == null) return null
    return json.toAnyMap().takeIf { it.getAllKeys().isNotEmpty() }
  }
}
