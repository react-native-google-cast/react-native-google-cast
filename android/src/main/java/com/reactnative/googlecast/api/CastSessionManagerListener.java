package com.reactnative.googlecast.api;

import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;

public class CastSessionManagerListener implements SessionManagerListener<CastSession> {
  @Override
  public void onSessionEnded(CastSession castSession, int error) {
  }

  @Override
  public void onSessionEnding(CastSession castSession) {
  }

  @Override
  public void onSessionResumeFailed(CastSession castSession, int error) {
  }

  @Override
  public void onSessionResumed(CastSession castSession, boolean wasSuspended) {
  }

  @Override
  public void onSessionResuming(CastSession castSession, String sessionId) {
  }

  @Override
  public void onSessionStartFailed(CastSession castSession, int error) {
  }

  @Override
  public void onSessionStarted(CastSession castSession, String sessionId) {
  }

  @Override
  public void onSessionStarting(CastSession castSession) {
  }

  @Override
  public void onSessionSuspended(CastSession castSession, int reason) {
  }
}
