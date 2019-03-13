package com.reactnative.googlecast;

import android.content.Intent;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class GoogleCastModule
        extends ReactContextBaseJavaModule implements LifecycleEventListener {

    @VisibleForTesting
    public static final String REACT_CLASS = "RNGoogleCast";

    protected static final String SESSION_STARTING = "GoogleCast:SessionStarting";
    protected static final String SESSION_STARTED = "GoogleCast:SessionStarted";
    protected static final String SESSION_START_FAILED =
            "GoogleCast:SessionStartFailed";
    protected static final String SESSION_SUSPENDED =
            "GoogleCast:SessionSuspended";
    protected static final String SESSION_RESUMING = "GoogleCast:SessionResuming";
    protected static final String SESSION_RESUMED = "GoogleCast:SessionResumed";
    protected static final String SESSION_ENDING = "GoogleCast:SessionEnding";
    protected static final String SESSION_ENDED = "GoogleCast:SessionEnded";

    protected static final String MEDIA_STATUS_UPDATED =
            "GoogleCast:MediaStatusUpdated";
    protected static final String MEDIA_PLAYBACK_STARTED =
            "GoogleCast:MediaPlaybackStarted";
    protected static final String MEDIA_PLAYBACK_ENDED =
            "GoogleCast:MediaPlaybackEnded";
    protected static final String MEDIA_PROGRESS_UPDATED =
            "GoogleCast:MediaProgressUpdated";

    protected static final  String CHANNEL_MESSAGE_RECEIVED = "GoogleCast:ChannelMessageReceived";

    private CastSession mCastSession;
    private SessionManagerListener<CastSession> mSessionManagerListener;

    public GoogleCastModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addLifecycleEventListener(this);
        setupCastListener();
    }

    @Override
    public String getName() {
        return REACT_CLASS;
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

        constants.put("MEDIA_STATUS_UPDATED", MEDIA_STATUS_UPDATED);
        constants.put("MEDIA_PLAYBACK_STARTED", MEDIA_PLAYBACK_STARTED);
        constants.put("MEDIA_PLAYBACK_ENDED", MEDIA_PLAYBACK_ENDED);
        constants.put("MEDIA_PROGRESS_UPDATED", MEDIA_PROGRESS_UPDATED);

        constants.put("CHANNEL_MESSAGE_RECEIVED", CHANNEL_MESSAGE_RECEIVED);
        return constants;
    }

    protected void emitMessageToRN(String eventName,
                                   @Nullable WritableMap params) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    @ReactMethod
    public void castMedia(final ReadableMap params) {
        if (mCastSession == null) {
            return;
        }

        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                RemoteMediaClient remoteMediaClient =
                        mCastSession.getRemoteMediaClient();
                if (remoteMediaClient == null) {
                    return;
                }

                Integer seconds = null;
                if (params.hasKey("playPosition")) {
                    seconds = params.getInt("playPosition");
                }
                if (seconds == null) {
                    seconds = 0;
                }

                remoteMediaClient.load(buildMediaInfo(params), true, seconds * 1000);

                Log.e(REACT_CLASS, "Casting media... ");
            }
        });
    }

    private MediaInfo buildMediaInfo(ReadableMap params) {
        MediaMetadata movieMetadata =
                new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);

        if (params.hasKey("title") && params.getString("title") != null) {
            movieMetadata.putString(MediaMetadata.KEY_TITLE,
                    params.getString("title"));
        }

        if (params.hasKey("subtitle") && params.getString("subtitle") != null) {
            movieMetadata.putString(MediaMetadata.KEY_SUBTITLE,
                    params.getString("subtitle"));
        }

        if (params.hasKey("studio") && params.getString("studio") != null) {
            movieMetadata.putString(MediaMetadata.KEY_STUDIO,
                    params.getString("studio"));
        }

        if (params.hasKey("imageUrl") && params.getString("imageUrl") != null) {
            movieMetadata.addImage(
                    new WebImage(Uri.parse(params.getString("imageUrl"))));
        }

        if (params.hasKey("posterUrl") && params.getString("posterUrl") != null) {
            movieMetadata.addImage(
                    new WebImage(Uri.parse(params.getString("posterUrl"))));
        }

        MediaInfo.Builder builder =
                new MediaInfo.Builder(params.getString("mediaUrl"))
                        .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                        .setMetadata(movieMetadata);

        if (params.hasKey("contentType") &&
                params.getString("contentType") != null) {
            builder = builder.setContentType(params.getString("contentType"));
        } else {
            builder = builder.setContentType("video/mp4");
        }

        if (params.hasKey("customData") && params.getMap("customData") != null) {
            builder = builder.setCustomData(new JSONObject(params.getMap("customData").toHashMap()));
        }

        if (params.hasKey("streamDuration")) {
            builder = builder.setStreamDuration(params.getInt("streamDuration"));
        }

        return builder.build();
    }

    @ReactMethod
    public void getCastDevice(final Promise promise) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
              if (mCastSession == null) {
                promise.resolve(null);
                return;
              }

              WritableMap map = Arguments.createMap();
              map.putString("id", mCastSession.getCastDevice().getDeviceId());
              map.putString("version", mCastSession.getCastDevice().getDeviceVersion());
              map.putString("name", mCastSession.getCastDevice().getFriendlyName());
              map.putString("model", mCastSession.getCastDevice().getModelName());
              promise.resolve(map);
            }
        });
    }

    @ReactMethod
    public void getCastState(final Promise promise) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                CastContext castContext =
                        CastContext.getSharedInstance(getReactApplicationContext());
                promise.resolve(castContext.getCastState() - 1);
            }
        });
    }


    @ReactMethod
    public void initChannel(final String namespace, final Promise promise) {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        mCastSession.setMessageReceivedCallbacks(namespace, new Cast.MessageReceivedCallback() {
                            @Override
                            public void onMessageReceived(CastDevice castDevice, String channelNameSpace, String message) {
                                WritableMap map = Arguments.createMap();
                                map.putString("channel", channelNameSpace);
                                map.putString("message", message);
                                emitMessageToRN(CHANNEL_MESSAGE_RECEIVED, map);
                            }
                        });
                        promise.resolve(true);
                    } catch (IOException e) {
                        e.printStackTrace();
                        promise.reject(e);
                    }
                }
            });
        }
    }

    @ReactMethod
    public void sendMessage(final String message, final String namespace, final Promise promise) {
        if(mCastSession != null){
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        mCastSession.sendMessage(namespace, message)
                                .setResultCallback(new ResultCallback<Status>() {
                                    @Override
                                    public void onResult(@NonNull Status status) {
                                        if (!status.isSuccess()) {
                                            Log.i(REACT_CLASS, "Error :> Sending message failed");
                                            promise.reject(String.valueOf(status.getStatusCode()), status.getStatusMessage());
                                        } else {
                                            Log.i(REACT_CLASS, "Message sent Successfully");
                                            promise.resolve(true);
                                        }
                                    }
                                });
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }
    }

    @ReactMethod
    public void play() {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    mCastSession.getRemoteMediaClient().play();
                }
            });
        }
    }

    @ReactMethod
    public void pause() {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    mCastSession.getRemoteMediaClient().pause();
                }
            });
        }
    }

    @ReactMethod
    public void stop() {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    mCastSession.getRemoteMediaClient().stop();
                }
            });
        }
    }

    @ReactMethod
    public void seek(final int position) {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                    mCastSession.getRemoteMediaClient().seek(position * 1000);
                }
            });
        }
    }

    @ReactMethod
    public void endSession(final boolean stopCasting, final Promise promise) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                SessionManager sessionManager =
                        CastContext.getSharedInstance(getReactApplicationContext())
                                .getSessionManager();
                sessionManager.endCurrentSession(stopCasting);
                promise.resolve(true);
            }
        });
    }

    @ReactMethod
    public void launchExpandedControls() {
        ReactApplicationContext context = getReactApplicationContext();
        Intent intent =
                new Intent(context, GoogleCastExpandedControlsActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    private void setupCastListener() {
        mSessionManagerListener = new GoogleCastSessionManagerListener(this);
    }

    @Override
    public void onHostResume() {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                SessionManager sessionManager =
                        CastContext.getSharedInstance(getReactApplicationContext())
                                .getSessionManager();
                sessionManager.addSessionManagerListener(mSessionManagerListener,
                        CastSession.class);
            }
        });
    }

    @Override
    public void onHostPause() {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                SessionManager sessionManager =
                        CastContext.getSharedInstance(getReactApplicationContext())
                                .getSessionManager();
                sessionManager.removeSessionManagerListener(mSessionManagerListener,
                        CastSession.class);
            }
        });
    }

    @Override
    public void onHostDestroy() {
    }

    protected void setCastSession(CastSession castSession) {
        this.mCastSession = castSession;
    }

    protected CastSession getCastSession() {
        return mCastSession;
    }

    protected void runOnUiQueueThread(Runnable runnable) {
        getReactApplicationContext().runOnUiQueueThread(runnable);
    }
}
