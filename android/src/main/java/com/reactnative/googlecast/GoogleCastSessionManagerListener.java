package com.reactnative.googlecast;

import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;
import java.io.IOException;

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
    setMessageReceivedCallbacks(session);
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
    setMessageReceivedCallbacks(session);
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

  private void setMessageReceivedCallbacks(CastSession session) {
    try {
      if (module.namespace != null)
        session.setMessageReceivedCallbacks(
                module.namespace,
                new CastMessageReceivedCallback());
    } catch (IOException e) {
      Log.e("tagOnSetReceiver", "Cast channel creation failed: ", e);
    }
  }

  private class CastMessageReceivedCallback implements Cast.MessageReceivedCallback {
    @Override
    public void onMessageReceived(CastDevice castDevice, String namespace, String message) {
      Log.d("tagOnMessage", "onMessageReceived: " + namespace + " / " + message);
      WritableMap map = Arguments.createMap();
      map.putString("namespace", namespace);
      map.putString("message", message);

      module.emitMessageToRN(GoogleCastModule.MESSAGE_RECEIVED, map);
    }
  }
}