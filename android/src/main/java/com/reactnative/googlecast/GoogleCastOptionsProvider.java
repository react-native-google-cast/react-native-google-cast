package com.reactnative.googlecast;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;

import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastOptions;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;
import com.google.android.gms.cast.framework.media.CastMediaOptions;
import com.google.android.gms.cast.framework.media.ImagePicker;
import com.google.android.gms.cast.framework.media.MediaIntentReceiver;
import com.google.android.gms.cast.framework.media.NotificationAction;
import com.google.android.gms.cast.framework.media.NotificationActionsProvider;
import com.google.android.gms.cast.framework.media.NotificationOptions;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.images.WebImage;

import java.util.Arrays;
import java.util.List;

public class GoogleCastOptionsProvider implements OptionsProvider {

  protected String getReceiverApplicationId(Context context) {
    String appId = null;
    try {
      PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), PackageManager.GET_META_DATA);
      appId = packageInfo.applicationInfo.metaData.getString("com.reactnative.googlecast.RECEIVER_APPLICATION_ID");
    } catch (PackageManager.NameNotFoundException e) {
    }
    return appId != null ? appId : CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID;
  }

  @Override
  public CastOptions getCastOptions(Context context) {
    NotificationOptions notificationOptions =
      new NotificationOptions.Builder()
        .setTargetActivityClassName(
          RNGCExpandedControllerActivity.class.getName())
        .setNotificationActionsProvider(new NotificationActionsProvider(context) {
          @Override
          public List<NotificationAction> getNotificationActions() {
            if (hasQueue()) return Arrays.asList(
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_SKIP_PREV).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_SKIP_NEXT).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_STOP_CASTING).build()
            );

            if (isPhoto()) return Arrays.asList(
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_STOP_CASTING).build()
            );

            return Arrays.asList(
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_REWIND).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_TOGGLE_PLAYBACK).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_FORWARD).build(),
              new NotificationAction.Builder().setAction(MediaIntentReceiver.ACTION_STOP_CASTING).build()
            );
          }

          @Override
          public int[] getCompactViewActionIndices() {
            // when playing a queue, display TOGGLE_PLAYBACK and SKIP_NEXT in the compact view
            if (hasQueue()) return new int[]{1, 2};

            // if a photo, display TOGGLE_PLAYBACK and STOP_CASTING
            if (isPhoto()) return new int[]{0, 1};

            // otherwise display TOGGLE_PLAYBACK and STOP_CASTING
            return new int[]{1, 3};
          }

          private boolean hasQueue() {
            CastContext castContext = CastContext.getSharedInstance(getApplicationContext());
            CastSession castSession = castContext.getSessionManager().getCurrentCastSession();
            if (castSession == null) {
              return false;
            }
            RemoteMediaClient client = castSession.getRemoteMediaClient();
            return client != null && client.getMediaStatus().getQueueItemCount() > 1;
          }

          private boolean isPhoto() {
            CastContext castContext = CastContext.getSharedInstance(getApplicationContext());
            CastSession castSession = castContext.getSessionManager().getCurrentCastSession();
            if (castSession == null) {
              return false;
            }
            RemoteMediaClient client = castSession.getRemoteMediaClient();
            return client != null && client.getMediaStatus().getMediaInfo().getMetadata().getMediaType() == MediaMetadata.MEDIA_TYPE_PHOTO;
          }

        })
        .build();

    CastMediaOptions mediaOptions =
      new CastMediaOptions.Builder()
        .setImagePicker(new ImagePickerImpl())
        .setNotificationOptions(notificationOptions)
        .setExpandedControllerActivityClassName(
          RNGCExpandedControllerActivity.class.getName())
        .build();

    return new CastOptions.Builder()
      .setReceiverApplicationId(getReceiverApplicationId(context))
      .setCastMediaOptions(mediaOptions)
      .build();
  }

  @Override
  public List<SessionProvider> getAdditionalSessionProviders(Context context) {
    return null;
  }

  private static class ImagePickerImpl extends ImagePicker {

    @Override
    public WebImage onPickImage(MediaMetadata mediaMetadata, int type) {
      if ((mediaMetadata == null) || !mediaMetadata.hasImages()) {
        return null;
      }
      List<WebImage> images = mediaMetadata.getImages();
      if (images.size() == 1) {
        return images.get(0);
      } else {
        if (type ==
          ImagePicker.IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND) {
          return images.get(0);
        } else {
          return images.get(1);
        }
      }
    }
  }
}
