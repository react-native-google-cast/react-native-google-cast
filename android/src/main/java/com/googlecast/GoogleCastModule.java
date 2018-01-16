package com.googlecast;

import android.net.Uri;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.images.WebImage;

import java.util.HashMap;
import java.util.Map;

public class GoogleCastModule
        extends ReactContextBaseJavaModule implements LifecycleEventListener {

    @VisibleForTesting
    public static final String REACT_CLASS = "GoogleCastModule";

    private static final String SESSION_STARTING = "GoogleCast:SessionStarting";
    private static final String SESSION_STARTED = "GoogleCast:SessionStarted";
    private static final String SESSION_START_FAILED =
            "GoogleCast:SessionStartFailed";
    private static final String SESSION_SUSPENDED = "GoogleCast:SessionSuspended";
    private static final String SESSION_RESUMING = "GoogleCast:SessionResuming";
    private static final String SESSION_RESUMED = "GoogleCast:SessionResumed";
    private static final String SESSION_ENDING = "GoogleCast:SessionEnding";
    private static final String SESSION_ENDED = "GoogleCast:SessionEnded";

    private CastSession mCastSession;
    private SessionManagerListener<CastSession> mSessionManagerListener;

    public GoogleCastModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addLifecycleEventListener(this);
        setupCastListener();
    }

    @Override
    public String getName() {
        return "GoogleCast";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("SESSION_STARTING", SESSION_STARTING);
        constants.put("SESSION_STARTED", SESSION_STARTED);
        constants.put("SESSION_START_FAILED", SESSION_START_FAILED);
        constants.put("SESSION_SUSPENDED", SESSION_SUSPENDED);
        constants.put("SESSION_RESUMING", SESSION_RESUMING);
        constants.put("SESSION_RESUMED", SESSION_RESUMED);
        constants.put("SESSION_ENDING", SESSION_ENDING);
        constants.put("SESSION_ENDED", SESSION_ENDED);
        return constants;
    }

    private void emitMessageToRN(String eventName,
                                 @Nullable WritableMap params) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void castMedia(ReadableMap params) {
        if (mCastSession == null) {
            return;
        }
        RemoteMediaClient remoteMediaClient = mCastSession.getRemoteMediaClient();
        if (remoteMediaClient == null) {
            return;
        }

        Integer seconds = params.getInt("seconds");
        if (seconds == null) {
            seconds = 0;
        }

        remoteMediaClient.load(buildMediaInfo(params), true, seconds * 1000);

        Log.e(REACT_CLASS, "Casting media... ");
    }

    private MediaInfo buildMediaInfo(ReadableMap params) {
        MediaMetadata movieMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);

        movieMetadata.putString(MediaMetadata.KEY_SUBTITLE, params.getString("subtitle"));
        movieMetadata.putString(MediaMetadata.KEY_TITLE, params.getString("title"));
        movieMetadata.addImage(new WebImage(Uri.parse(params.getString("imageUrl"))));
        movieMetadata.addImage(new WebImage(Uri.parse(params.getString("posterUrl"))));

        return new MediaInfo.Builder(params.getString("mediaUrl"))
                .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                .setContentType("videos/mp4")
                .setMetadata(movieMetadata)
                .setStreamDuration(params.getInt("duration") * 1000)
                .build();
    }

    private void setupCastListener() {
        mSessionManagerListener = new SessionManagerListener<CastSession>() {

            @Override
            public void onSessionEnded(CastSession session, int error) {
                onApplicationDisconnected();
                emitMessageToRN(SESSION_ENDED, null);
            }

            @Override
            public void onSessionResumed(CastSession session, boolean wasSuspended) {
                onApplicationConnected(session);
                emitMessageToRN(SESSION_RESUMED, null);
            }

            @Override
            public void onSessionResumeFailed(CastSession session, int error) {
                onApplicationDisconnected();
                // TODO: find corresponding iOS event
            }

            @Override
            public void onSessionStarted(CastSession session, String sessionId) {
                onApplicationConnected(session);
                emitMessageToRN(SESSION_STARTED, null);
            }

            @Override
            public void onSessionStartFailed(CastSession session, int error) {
                onApplicationDisconnected();
                emitMessageToRN(SESSION_START_FAILED, null);
            }

            @Override
            public void onSessionStarting(CastSession session) {
                emitMessageToRN(SESSION_STARTING, null);
            }

            @Override
            public void onSessionEnding(CastSession session) {
                emitMessageToRN(SESSION_ENDING, null);
            }

            @Override
            public void onSessionResuming(CastSession session, String sessionId) {
                emitMessageToRN(SESSION_RESUMING, null);
            }

            @Override
            public void onSessionSuspended(CastSession session, int reason) {
                emitMessageToRN(SESSION_SUSPENDED, null);
            }

            private void onApplicationConnected(CastSession castSession) {
                mCastSession = castSession;
            }

            private void onApplicationDisconnected() {
                mCastSession = null;
            }
        };
    }

    @Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
    }
}
