package com.googlecast;

import android.net.Uri;

import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.common.images.WebImage;
import com.google.android.libraries.cast.companionlibrary.cast.CastConfiguration;
import android.support.annotation.Nullable;

/**
 * Created by Charlie on 6/9/16.
 */
public class GoogleCastService {
    public static final String REACT_CLASS = "GoogleCastModule";

    public static MediaInfo getMediaInfo(String filmUrl, String filmTitle, String imageUrl) {
        MediaMetadata mediaMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);
        mediaMetadata.putString(MediaMetadata.KEY_TITLE, filmTitle);
        mediaMetadata.addImage(new WebImage(Uri.parse(imageUrl)));

        MediaInfo mediaInfo = new MediaInfo.Builder(filmUrl)
                .setContentType("video/mp4")
                .setStreamType(MediaInfo.STREAM_TYPE_BUFFERED)
                .setMetadata(mediaMetadata).build();
        return mediaInfo;
    }

    public static CastConfiguration getCastConfig(@Nullable String appId){
        CastConfiguration options = new CastConfiguration.Builder(appId)
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
