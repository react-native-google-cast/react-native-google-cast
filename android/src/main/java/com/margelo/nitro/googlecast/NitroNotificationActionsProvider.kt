package com.margelo.nitro.googlecast

import android.content.Context
import com.google.android.gms.cast.framework.CastContext
import com.google.android.gms.cast.framework.media.NotificationAction
import com.google.android.gms.cast.framework.media.NotificationActionsProvider

/**
 * Decision-4 notification actions, delegating to the pure
 * [CastOptionsDefaults.notificationActionsFor] heuristic.
 *
 * Reentrancy (contract iii): the Cast context is resolved **lazily inside the
 * callbacks** via the zero-arg nullable `CastContext.getSharedInstance()` —
 * they run at notification-build time, long after `CastContext` init
 * completed. Construction (which happens *during* init, inside
 * [NitroCastOptionsProvider.getCastOptions]) touches nothing but the
 * [Context] the base class stores.
 */
internal class NitroNotificationActionsProvider(context: Context) :
  NotificationActionsProvider(context) {

  override fun getNotificationActions(): List<NotificationAction> {
    return currentSpec().actions.map { NotificationAction.Builder().setAction(it).build() }
  }

  override fun getCompactViewActionIndices(): IntArray = currentSpec().compactViewIndices

  /** Re-resolved per callback (Invariant 1 — no cached session handle). */
  private fun currentSpec(): NotificationActionsSpec {
    val mediaStatus = CastContext.getSharedInstance()
      ?.sessionManager
      ?.currentCastSession
      ?.remoteMediaClient
      ?.mediaStatus
    return CastOptionsDefaults.notificationActionsFor(
      mediaStatus?.queueItemCount ?: 0,
      mediaStatus?.mediaInfo?.metadata?.mediaType
    )
  }
}
