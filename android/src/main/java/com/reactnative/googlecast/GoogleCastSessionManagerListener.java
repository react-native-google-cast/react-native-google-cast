package com.reactnative.googlecast;

import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;

public class GoogleCastSessionManagerListener
    implements SessionManagerListener<CastSession> {
  private GoogleCastModule module;
  private GoogleCastRemoteMediaClientListener remoteMediaClientListener;

  public GoogleCastSessionManagerListener(GoogleCastModule module) {
    this.module = module;
  }

  @Override
  public void onSessionEnded(CastSession session, int error) {
    onApplicationDisconnected();
    module.emitMessageToRN(GoogleCastModule.SESSION_ENDED, null);
  }

  @Override
  public void onSessionResumed(CastSession session, boolean wasSuspended) {
    onApplicationConnected(session);
    module.emitMessageToRN(GoogleCastModule.SESSION_RESUMED, null);
  }

  @Override
  public void onSessionResumeFailed(CastSession session, int error) {
    onApplicationDisconnected();
    // TODO: find corresponding iOS event
  }

  @Override
  public void onSessionStarted(CastSession session, String sessionId) {
    onApplicationConnected(session);
    module.emitMessageToRN(GoogleCastModule.SESSION_STARTED, null);
  }

  @Override
  public void onSessionStartFailed(CastSession session, int error) {
    onApplicationDisconnected();
    module.emitMessageToRN(GoogleCastModule.SESSION_START_FAILED, null);
  }

  @Override
  public void onSessionStarting(CastSession session) {
    module.emitMessageToRN(GoogleCastModule.SESSION_STARTING, null);
  }

  @Override
  public void onSessionEnding(CastSession session) {
    module.emitMessageToRN(GoogleCastModule.SESSION_ENDING, null);
  }

  @Override
  public void onSessionResuming(CastSession session, String sessionId) {
    module.emitMessageToRN(GoogleCastModule.SESSION_RESUMING, null);
  }

  @Override
  public void onSessionSuspended(CastSession session, int reason) {
    module.emitMessageToRN(GoogleCastModule.SESSION_SUSPENDED, null);
  }

  private void onApplicationConnected(final CastSession castSession) {
    module.setCastSession(castSession);
    module.runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        remoteMediaClientListener =
            new GoogleCastRemoteMediaClientListener(module);
        castSession.getRemoteMediaClient().addListener(
            remoteMediaClientListener);
        castSession.getRemoteMediaClient().addProgressListener(remoteMediaClientListener, 1000);
      }
    });
  }

  private void onApplicationDisconnected() { module.setCastSession(null); }
}
