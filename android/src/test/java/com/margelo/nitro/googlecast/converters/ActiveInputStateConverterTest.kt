package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.ActiveInputState
import com.google.android.gms.cast.Cast
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the ActiveInputState enum↔GCK converter (Android side of T1).
 *
 * Mirrors the iOS `StateEnumConverterTests.testActiveInputStateRoundTrips()` pattern.
 * GCK represents active-input state as plain int constants; the expected values are pinned
 * by GCK constant name (UNKNOWN=-1, NO/INACTIVE=0, YES/ACTIVE=1) matching the iOS test.
 *
 * PlayServicesState has no iOS GCK counterpart and is exercised in PlayServicesStateConverterTest.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class ActiveInputStateConverterTest {

  @Test
  fun forwardMapsToGckConstants() {
    assertEquals("UNKNOWN gck value", Cast.ACTIVE_INPUT_STATE_UNKNOWN, ActiveInputState.UNKNOWN.toGckActiveInputState())
    assertEquals("INACTIVE gck value", Cast.ACTIVE_INPUT_STATE_NO, ActiveInputState.INACTIVE.toGckActiveInputState())
    assertEquals("ACTIVE gck value", Cast.ACTIVE_INPUT_STATE_YES, ActiveInputState.ACTIVE.toGckActiveInputState())
  }

  @Test
  fun reverseRoundTrips() {
    assertEquals("UNKNOWN round-trip", ActiveInputState.UNKNOWN, ActiveInputState.fromGckActiveInputState(Cast.ACTIVE_INPUT_STATE_UNKNOWN))
    assertEquals("INACTIVE round-trip", ActiveInputState.INACTIVE, ActiveInputState.fromGckActiveInputState(Cast.ACTIVE_INPUT_STATE_NO))
    assertEquals("ACTIVE round-trip", ActiveInputState.ACTIVE, ActiveInputState.fromGckActiveInputState(Cast.ACTIVE_INPUT_STATE_YES))
  }

  @Test
  fun unrecognizedGckValueFallsBackToUnknown() {
    assertEquals("unrecognized → UNKNOWN", ActiveInputState.UNKNOWN, ActiveInputState.fromGckActiveInputState(99))
  }
}
