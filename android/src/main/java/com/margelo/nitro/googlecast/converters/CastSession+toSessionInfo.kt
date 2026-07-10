package com.margelo.nitro.googlecast.converters

import com.google.android.gms.cast.framework.CastSession
import com.margelo.nitro.googlecast.ActiveInputState
import com.margelo.nitro.googlecast.SessionInfo
import com.margelo.nitro.googlecast.StandbyState

/**
 * Builds a fully-populated [SessionInfo] from a live [CastSession].
 *
 * Returns `null` when the session has no `castDevice` yet (preserves the prior
 * `sessionInfo` contract — a device is the minimum a `SessionInfo` needs).
 *
 * Progressive enrichment: every device-detail getter on `CastSession`
 * (`getVolume`/`isMute`/`getApplicationMetadata`/`getApplicationStatus`/
 * `getStandbyState`/`getActiveInputState`) throws `IllegalStateException` until the
 * session is fully connected, so each is read through the narrow [readWhenConnected]
 * guard → `null`. A `STARTED` event may therefore carry null detail that a later
 * `Cast.Listener` callback (e.g. `onVolumeChanged`) backfills.
 *
 * Semantic distinction: a *thrown* getter → `null` ("can't read yet"); a getter that
 * *returns* `STANDBY_STATE_UNKNOWN`/`-1` → [StandbyState.UNKNOWN] ("connected, device
 * reports unknown"). The two are deliberately different.
 */
internal fun CastSession.toSessionInfo(sessionId: String? = null): SessionInfo? {
  val device = castDevice ?: return null
  return SessionInfo(
    sessionId = sessionId ?: this.sessionId ?: "",
    device = device.toDevice(),
    applicationMetadata = readWhenConnected { applicationMetadata }?.toApplicationMetadata(),
    applicationStatus = readWhenConnected { applicationStatus },
    deviceVolume = readWhenConnected { volume },
    deviceMuted = readWhenConnected { isMute },
    standbyState = readWhenConnected { standbyState }?.let { StandbyState.fromGckStandbyState(it) },
    activeInputState =
      readWhenConnected { activeInputState }?.let { ActiveInputState.fromGckActiveInputState(it) }
  )
}

/**
 * Runs [block] and maps its `IllegalStateException` (thrown by `CastSession` detail getters
 * before the session is connected) to `null`. Local to this converter so `Hybrid*` stays free
 * of read-guard clutter.
 */
private inline fun <T> readWhenConnected(block: () -> T): T? =
  try {
    block()
  } catch (e: IllegalStateException) {
    null
  }
