package com.margelo.nitro.googlecast.converters

import com.margelo.nitro.googlecast.StandbyState
import com.google.android.gms.cast.Cast
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Parity test for the StandbyState enum↔GCK converter (Android side of T1).
 *
 * Mirrors the iOS `StateEnumConverterTests.testStandbyStateRoundTrips()` pattern.
 * GCK represents standby state as plain int constants; values are identical to
 * ACTIVE_INPUT_STATE_* (UNKNOWN=-1, NO/INACTIVE=0, YES/ACTIVE=1).
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [34])
class StandbyStateConverterTest {

  @Test
  fun forwardMapsToGckConstants() {
    assertEquals("UNKNOWN gck value", Cast.STANDBY_STATE_UNKNOWN, StandbyState.UNKNOWN.toGckStandbyState())
    assertEquals("INACTIVE gck value", Cast.STANDBY_STATE_NO, StandbyState.INACTIVE.toGckStandbyState())
    assertEquals("ACTIVE gck value", Cast.STANDBY_STATE_YES, StandbyState.ACTIVE.toGckStandbyState())
  }

  @Test
  fun reverseRoundTrips() {
    assertEquals("UNKNOWN round-trip", StandbyState.UNKNOWN, StandbyState.fromGckStandbyState(Cast.STANDBY_STATE_UNKNOWN))
    assertEquals("INACTIVE round-trip", StandbyState.INACTIVE, StandbyState.fromGckStandbyState(Cast.STANDBY_STATE_NO))
    assertEquals("ACTIVE round-trip", StandbyState.ACTIVE, StandbyState.fromGckStandbyState(Cast.STANDBY_STATE_YES))
  }

  @Test
  fun unrecognizedGckValueFallsBackToUnknown() {
    assertEquals("unrecognized → UNKNOWN", StandbyState.UNKNOWN, StandbyState.fromGckStandbyState(99))
  }
}
