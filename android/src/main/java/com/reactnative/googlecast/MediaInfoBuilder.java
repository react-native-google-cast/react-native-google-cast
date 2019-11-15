package com.reactnative.googlecast;

import android.net.Uri;
import android.support.annotation.NonNull;

import com.facebook.react.bridge.ReadableMap;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.TextTrackStyle;
import com.google.android.gms.common.images.WebImage;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class MediaInfoBuilder {
    private static final String DEFAULT_CONTENT_TYPE = "video/mp4";

    private static final Map<String, Integer> NAME_TO_EDGE_TYPE_MAP =
            new HashMap<String, Integer>() {
                {
                    put("depressed", TextTrackStyle.EDGE_TYPE_DEPRESSED);
                    put("dropShadow", TextTrackStyle.EDGE_TYPE_DROP_SHADOW);
                    put("none", TextTrackStyle.EDGE_TYPE_NONE);
                    put("outline", TextTrackStyle.EDGE_TYPE_OUTLINE);
                    put("raised", TextTrackStyle.EDGE_TYPE_RAISED);
                }
            };

    private static final Map<String, Integer> NAME_TO_GENERIC_FONT_FAMILY_MAP =
            new HashMap<String, Integer>() {
                {
                    put("casual", TextTrackStyle.FONT_FAMILY_CASUAL);
                    put("cursive", TextTrackStyle.FONT_FAMILY_CURSIVE);
                    put("monoSansSerif", TextTrackStyle.FONT_FAMILY_MONOSPACED_SANS_SERIF);
                    put("monoSerif", TextTrackStyle.FONT_FAMILY_MONOSPACED_SERIF);
                    put("sansSerif", TextTrackStyle.FONT_FAMILY_SANS_SERIF);
                    put("serif", TextTrackStyle.FONT_FAMILY_SERIF);
                    put("smallCaps", TextTrackStyle.FONT_FAMILY_SMALL_CAPITALS);
                }
            };

    private static final Map<String, Integer> NAME_TO_FONT_STYLE_MAP =
            new HashMap<String, Integer>() {
                {
                    put("bold", TextTrackStyle.FONT_STYLE_BOLD);
                    put("boldItalic", TextTrackStyle.FONT_STYLE_BOLD_ITALIC);
                    put("italic", TextTrackStyle.FONT_STYLE_ITALIC);
                    put("normal", TextTrackStyle.FONT_STYLE_NORMAL);
                }
            };

    private static final Map<String, Integer> NAME_TO_WINDOW_TYPE_MAP =
            new HashMap<String, Integer>() {
                {
                    put("none", TextTrackStyle.WINDOW_TYPE_NONE);
                    put("normal", TextTrackStyle.WINDOW_TYPE_NORMAL);
                    put("rounded", TextTrackStyle.WINDOW_TYPE_ROUNDED);
                }
            };

    public static @NonNull MediaInfo buildMediaInfo(@NonNull ReadableMap parameters) {
        MediaMetadata movieMetadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_MOVIE);

        String title = ReadableMapUtils.getString(parameters, "title");
        if (title != null) {
            movieMetadata.putString(MediaMetadata.KEY_TITLE, title);
        }

        String subtitle = ReadableMapUtils.getString(parameters, "subtitle");
        if (subtitle != null) {
            movieMetadata.putString(MediaMetadata.KEY_SUBTITLE, subtitle);
        }

        String studio = ReadableMapUtils.getString(parameters, "studio");
        if (studio != null) {
            movieMetadata.putString(MediaMetadata.KEY_STUDIO, studio);
        }

        String imageUrl = ReadableMapUtils.getString(parameters, "imageUrl");
        if (imageUrl != null) {
            movieMetadata.addImage(new WebImage(Uri.parse(imageUrl)));
        }

        String posterUrl = ReadableMapUtils.getString(parameters, "posterUrl");
        if (posterUrl != null) {
            movieMetadata.addImage(new WebImage(Uri.parse(posterUrl)));
        }

        String mediaUrl = ReadableMapUtils.getString(parameters, "mediaUrl");
        if (mediaUrl == null) {
            throw new IllegalArgumentException("mediaUrl option is required");
        }

        Boolean isLive = ReadableMapUtils.getBoolean(parameters, "isLive");
        int streamType =
                isLive != null && isLive
                        ? MediaInfo.STREAM_TYPE_LIVE
                        : MediaInfo.STREAM_TYPE_BUFFERED;

        MediaInfo.Builder builder =
                new MediaInfo.Builder(mediaUrl)
                        .setStreamType(streamType)
                        .setMetadata(movieMetadata);

        String contentType = ReadableMapUtils.getString(parameters, "contentType");
        builder = builder.setContentType(contentType != null ? contentType : DEFAULT_CONTENT_TYPE);

        Map<?, ?> customData = ReadableMapUtils.getMap(parameters, "customData");
        if (customData != null) {
            builder = builder.setCustomData(new JSONObject(customData));
        }

        Integer streamDuration = ReadableMapUtils.getInt(parameters, "streamDuration");
        if (streamDuration != null) {
            builder = builder.setStreamDuration(streamDuration);
        }

        ReadableMap textTrackStyle = ReadableMapUtils.getReadableMap(parameters, "textTrackStyle");
        if (textTrackStyle != null) {
            builder = builder.setTextTrackStyle(buildTextTrackStyle(textTrackStyle));
        }

        return builder.build();
    }

    private static TextTrackStyle buildTextTrackStyle(ReadableMap params) {
        TextTrackStyle style = new TextTrackStyle();

        Integer backgroundColor = ReadableMapUtils.getColor(params, "backgroundColor");
        if (backgroundColor != null) {
            style.setBackgroundColor(backgroundColor);
        }

        Integer edgeColor = ReadableMapUtils.getColor(params, "edgeColor");
        if (edgeColor != null) {
            style.setEdgeColor(edgeColor);
        }

        String edgeTypeName = ReadableMapUtils.getString(params, "edgeType");
        if (edgeTypeName != null && NAME_TO_EDGE_TYPE_MAP.containsKey(edgeTypeName)) {
            style.setEdgeType(NAME_TO_EDGE_TYPE_MAP.get(edgeTypeName));
        }

        String fontFamily = ReadableMapUtils.getString(params, "fontFamily");
        if (fontFamily != null) {
            style.setFontFamily(fontFamily);
        }

        String fontGenericFamilyName = ReadableMapUtils.getString(params, "fontGenericFamily");
        if (fontGenericFamilyName != null
                && NAME_TO_GENERIC_FONT_FAMILY_MAP.containsKey(fontGenericFamilyName)) {
            style.setFontGenericFamily(NAME_TO_GENERIC_FONT_FAMILY_MAP.get(fontGenericFamilyName));
        }

        Float fontScale = ReadableMapUtils.getFloat(params, "fontScale");
        if (fontScale != null) {
            style.setFontScale(fontScale);
        }

        String fontStyleName = ReadableMapUtils.getString(params, "fontStyle");
        if (fontStyleName != null && NAME_TO_FONT_STYLE_MAP.containsKey(fontStyleName)) {
            style.setFontStyle(NAME_TO_FONT_STYLE_MAP.get(fontStyleName));
        }

        Integer foregroundColor = ReadableMapUtils.getColor(params, "foregroundColor");
        if (foregroundColor != null) {
            style.setForegroundColor(foregroundColor);
        }

        Integer windowColor = ReadableMapUtils.getColor(params, "windowColor");
        if (windowColor != null) {
            style.setWindowColor(windowColor);
        }

        Integer windowCornerRadius = ReadableMapUtils.getInt(params, "windowCornerRadius");
        if (windowCornerRadius != null) {
            style.setWindowCornerRadius(windowCornerRadius);
        }

        String windowTypeName = ReadableMapUtils.getString(params, "windowType");
        if (windowTypeName != null && NAME_TO_WINDOW_TYPE_MAP.containsKey(windowTypeName)) {
            style.setWindowType(NAME_TO_WINDOW_TYPE_MAP.get(windowTypeName));
        }

        return style;
    }
}
