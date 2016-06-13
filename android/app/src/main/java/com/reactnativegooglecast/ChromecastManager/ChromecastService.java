package com.reactnativegooglecast.ChromecastManager;

import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.libraries.cast.companionlibrary.cast.CastConfiguration;
import com.google.android.libraries.cast.companionlibrary.cast.VideoCastManager;
import com.google.android.libraries.cast.companionlibrary.cast.callbacks.VideoCastConsumer;

/**
 * Created by Charlie on 6/9/16.
 */
public class ChromecastService {
    private VideoCastManager mCastManager;
    private VideoCastConsumer mCastConsumer;
    public static final String REACT_CLASS = "ChromecastModule";

    public static MediaInfo getMediaInfo(String filmUrl, String filmTitle) {
        MediaMetadata mediaMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);
        mediaMetadata.putString(MediaMetadata.KEY_TITLE, filmTitle);

        MediaInfo mediaInfo = new MediaInfo.Builder(filmUrl)
                .setContentType("video/mp4")
                .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                .setMetadata(mediaMetadata).build();
        return mediaInfo;
    }

    public static CastConfiguration getCastConfig(){
        CastConfiguration options = new CastConfiguration.Builder(CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID)
                .enableAutoReconnect()
                .enableNotification()
                .addNotificationAction(CastConfiguration.NOTIFICATION_ACTION_SKIP_PREVIOUS, false)
                .addNotificationAction(CastConfiguration.NOTIFICATION_ACTION_SKIP_NEXT, false)
                .addNotificationAction(CastConfiguration.NOTIFICATION_ACTION_PLAY_PAUSE, true)
                .addNotificationAction(CastConfiguration.NOTIFICATION_ACTION_FORWARD, false)
                .addNotificationAction(CastConfiguration.NOTIFICATION_ACTION_DISCONNECT, true).setForwardStep(10)
                .build();
        return options;
    }
}
