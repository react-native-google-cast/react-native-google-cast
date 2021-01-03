package com.reactnative.googlecast.api;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.google.android.gms.cast.CastStatusCodes;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.Result;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;

final class RNGCPendingResult {
  public static void promisifyResult(final PendingResult result, final Promise promise) {
    result.setResultCallback(new ResultCallback() {
      @Override
      public void onResult(@NonNull Result result) {
        final Status status = result.getStatus();
        if (status.isSuccess()) {
          promise.resolve(null);
        } else {
          final String message = CastStatusCodes.getStatusCodeString(status.getStatusCode());
          promise.reject(new Exception(message));
        }
      }
    });
  }
}
