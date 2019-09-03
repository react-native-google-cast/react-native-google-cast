package com.reactnative.googlecast.api;

import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;

public class RNGCSessionManagerListener
    implements SessionManagerListener<CastSession> {

  private RNGCCastContext module;
  private CastSession castSession;
  private RNGCRemoteMediaClientListener remoteMediaClientListener;

  public RNGCSessionManagerListener(RNGCCastContext module) {
    this.module = module;
  }

  @Override
  public void onSessionEnded(CastSession session, int error) {
    onDisconnected();
    module.sendEvent(RNGCCastContext.SESSION_ENDED, null);
  }

  @Override
  public void onSessionResumed(CastSession session, boolean wasSuspended) {
    onConnected(session);
    module.sendEvent(RNGCCastContext.SESSION_RESUMED, null);
  }

  @Override
  public void onSessionResumeFailed(CastSession session, int error) {
    onDisconnected();
    // TODO: find corresponding iOS event
  }

  @Override
  public void onSessionStarted(CastSession session, String sessionId) {
    onConnected(session);
    module.sendEvent(RNGCCastContext.SESSION_STARTED, null);
  }

  @Override
  public void onSessionStartFailed(CastSession session, int error) {
    onDisconnected();
    module.sendEvent(RNGCCastContext.SESSION_START_FAILED, null);
  }

  @Override
  public void onSessionStarting(CastSession session) {
    module.sendEvent(RNGCCastContext.SESSION_STARTING, null);
  }

  @Override
  public void onSessionEnding(CastSession session) {
    module.sendEvent(RNGCCastContext.SESSION_ENDING, null);
  }

  @Override
  public void onSessionResuming(CastSession session, String sessionId) {
    module.sendEvent(RNGCCastContext.SESSION_RESUMING, null);
  }

  @Override
  public void onSessionSuspended(CastSession session, int reason) {
    module.sendEvent(RNGCCastContext.SESSION_SUSPENDED, null);
  }

  private void onConnected(final CastSession castSession) {
    this.castSession = castSession;

//    remoteMediaClientListener = new RNGCRemoteMediaClientListener(module);
//    castSession.getRemoteMediaClient().registerCallback(
//        remoteMediaClientListener);
  }

  private void onDisconnected() { this.castSession = null; }
}
