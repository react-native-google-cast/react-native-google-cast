package com.reactnative.googlecast.api;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactContext;
import com.google.android.gms.common.api.PendingResult;

abstract class With<X> {
  protected interface WithX<X> {
    void execute(X x);
  }

  protected interface WithXPromisify<X> {
    @Nullable
    PendingResult execute(X client);
  }

  protected void withX(final WithX<X> runnable) throws IllegalStateException {
    withX(new WithXPromisify<X>() {
      @Override
      public PendingResult execute(X x) {
        runnable.execute(x);
        return null;
      }
    }, null);
  }

  protected void withX(final WithX<X> runnable, final Promise promise) {
    withX(new WithXPromisify<X>() {
      @Override
      public PendingResult execute(X x) {
        runnable.execute(x);
        return null;
      }
    }, promise);
  }

  protected void withX(final WithXPromisify<X> runnable,
                       final @Nullable Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        try {
          final X x = getX();

          if (x == null) {
            if (promise != null) promise.reject(new IllegalStateException("No session"));
            return;
          }

          PendingResult pendingResult = runnable.execute(x);

          if (pendingResult != null) {
            RNGCPendingResult.promisifyResult(pendingResult, promise);
          } else if (promise != null) {
            promise.resolve(null);
          }
        } catch (Exception e) {
          if (promise != null) promise.reject(e);
        }
      }
    });
  }

  abstract protected @Nullable X getX();

  abstract protected ReactContext getReactApplicationContext();
}
