package com.reactnative.googlecast;

import android.content.Context;
import android.content.Intent;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.CastDevice;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaQueueItem;
import com.google.android.gms.cast.MediaStatus;
import com.google.android.gms.cast.MediaTrack;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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

    protected static final String E_CAST_NOT_AVAILABLE = "E_CAST_NOT_AVAILABLE";
    protected static final String GOOGLE_CAST_NOT_AVAILABLE_MESSAGE = "Google Cast not available";
    protected static final String DEFAULT_SUBTITLES_LANGUAGE = Locale.ENGLISH.getLanguage();

    private CastSession mCastSession;
    private SessionManagerListener<CastSession> mSessionManagerListener;

    /*
    'CAST_AVAILABLE' is volatile because 'initializeCast' is called on the main thread, but
    react-native modules may be initialized on any thread.
    */
    private static volatile boolean CAST_AVAILABLE = true;

    public GoogleCastModule(ReactApplicationContext reactContext) {
        super(reactContext);
        if (CAST_AVAILABLE) {
            reactContext.addLifecycleEventListener(this);
            setupCastListener();
        }
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

        constants.put("CAST_AVAILABLE", CAST_AVAILABLE);

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
    public void showCastPicker() {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                GoogleCastButtonManager.getGoogleCastButtonManagerInstance().performClick();
                Log.e(REACT_CLASS, "showCastPicker... ");
            }
        });
    }

    @ReactMethod
    public void castMediaMultiple(final ReadableMap params){
        if (mCastSession == null){
            return;
        }
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                RemoteMediaClient remoteMediaClient = mCastSession.getRemoteMediaClient();
                if (remoteMediaClient == null) {
                    return;
                }

                ReadableArray listParams = null;
                Integer repeatMode = 0;
                if(params.hasKey("castedMediaList")){
                    listParams = ReadableMapUtils.getReadableArray(params, "castedMediaList");
                }
                if(params.hasKey("repeatMode")){
                    repeatMode = params.getInt("repeatMode");
                }

                ArrayList<MediaQueueItem> queueList = new ArrayList<>();
                int startIndex = 0;

                for(int i=0 ; i<listParams.size(); i++){
                    MediaQueueItem item = new MediaQueueItem.Builder(MediaInfoBuilder.buildMediaInfo(listParams.getMap(i))).build();
                    queueList.add(item);
                }

                remoteMediaClient.queueLoad(queueList.toArray(new MediaQueueItem[listParams.size()]), startIndex,  repeatMode, null);


                Log.e(REACT_CLASS, "Casting media multiple... ");
            }
        });
    }

    @ReactMethod
    public void castMedia(final ReadableMap params) {
        if (mCastSession == null) {
            return;
        }

        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                RemoteMediaClient remoteMediaClient = mCastSession.getRemoteMediaClient();
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

                MediaInfo mediaInfo = MediaInfoBuilder.buildMediaInfo(params);
                remoteMediaClient.load(mediaInfo, true, seconds * 1000);

                Log.e(REACT_CLASS, "Casting media... ");
            }
        });
    }

    public static void initializeCast(Context context){
        try {
            CastContext.getSharedInstance(context);
        } catch(RuntimeException e) {
            CAST_AVAILABLE = false;
        }
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
                if (CAST_AVAILABLE) {
                    CastContext castContext =
                        CastContext.getSharedInstance(getReactApplicationContext());
                    promise.resolve(castContext.getCastState() - 1);
                } else {
                    promise.reject(E_CAST_NOT_AVAILABLE, GOOGLE_CAST_NOT_AVAILABLE_MESSAGE);
                }
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
                    RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                    if (client == null) {
                        return;
                    }

                    client.play();
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
                    RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                    if (client == null) {
                        return;
                    }

                    client.pause();
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
                    RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                    if (client == null) {
                        return;
                    }

                    client.stop();
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
                    RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                    if (client == null) {
                        return;
                    }

                    client.seek(position * 1000);
                }
            });
        }
    }

    @ReactMethod
    public void setVolume(final double volume) {
        if (mCastSession != null) {
            getReactApplicationContext().runOnUiQueueThread(new Runnable() {
                @Override
                public void run() {
                  RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                  if (client == null) {
                    return;
                  }

                  client.setStreamVolume(volume);
                }
            });
        }
    }

    @ReactMethod
    public void endSession(final boolean stopCasting, final Promise promise) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                if (CAST_AVAILABLE) {
                    SessionManager sessionManager =
                        CastContext.getSharedInstance(getReactApplicationContext())
                                .getSessionManager();
                    sessionManager.endCurrentSession(stopCasting);
                    promise.resolve(true);
                } else {
                    promise.reject(E_CAST_NOT_AVAILABLE, GOOGLE_CAST_NOT_AVAILABLE_MESSAGE);
                }
            }
        });
    }

    @ReactMethod
    public void launchExpandedControls() {
        if (CAST_AVAILABLE) {
            ReactApplicationContext context = getReactApplicationContext();
            Intent intent = new Intent(context, GoogleCastExpandedControlsActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } else {
            Log.i(REACT_CLASS, "Error :> " + GOOGLE_CAST_NOT_AVAILABLE_MESSAGE);
        }

    }

    @ReactMethod
    public void toggleSubtitles(final boolean enabled, final String languageCode) {
        if (mCastSession == null) {
            return;
        }

        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                if (mCastSession == null) {
                    return;
                }

                RemoteMediaClient client = mCastSession.getRemoteMediaClient();
                if (client == null) {
                    return;
                }

                if (!enabled) {
                    client.setActiveMediaTracks(new long[] {});
                    return;
                }

                MediaInfo mediaInfo = client.getMediaInfo();
                if (mediaInfo == null) {
                    return;
                }


                List<MediaTrack> tracks = mediaInfo.getMediaTracks();
                if (tracks == null || tracks.isEmpty()) {
                    return;
                }

                String languageToSelect = languageCode != null ? languageCode : DEFAULT_SUBTITLES_LANGUAGE;
                for (MediaTrack track : tracks) {
                    if (
                        track != null &&
                        track.getType() == MediaTrack.TYPE_TEXT &&
                        (
                            track.getSubtype() == MediaTrack.SUBTYPE_NONE || // Sometimes not provided.
                            track.getSubtype() == MediaTrack.SUBTYPE_SUBTITLES ||
                            track.getSubtype() == MediaTrack.SUBTYPE_CAPTIONS
                        ) &&
                        track.getLanguage().equals(languageToSelect)
                    ) {
                        client.setActiveMediaTracks(new long[]{ track.getId() });
                        return;
                    }
                }
            }
        });
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

    protected @Nullable MediaStatus getMediaStatus() {
        if (mCastSession == null) {
            return null;
        }

        RemoteMediaClient client = mCastSession.getRemoteMediaClient();
        if (client == null) {
            return null;
        }

        return client.getMediaStatus();
    }

    protected void runOnUiQueueThread(Runnable runnable) {
        getReactApplicationContext().runOnUiQueueThread(runnable);
    }
}
