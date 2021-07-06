---
id: media-tracks
title: Media Tracks
sidebar_label: Media Tracks
---

[MediaTrack](../api/interfaces/mediatrack) represents a media track, which can be an audio stream, a video stream, or text (such as subtitles or closed caption).

> Note: Currently, the Styled Media Receiver and Default Media Receiver allow you to use only the text tracks with the API. To work with the audio and video tracks, you must develop a Custom Receiver.

## Load tracks

Some media containers such as an HLS stream already contain track information as part of its m3u8 manifest. Those tracks will be available automatically in `mediaStatus.mediaInfo.mediaTracks` after the media is loaded.

If the video stream doesn't contain other tracks, or you want to load additional tracks, you can add them when loading the media. The following code creates an English text track, a French text track and a French audio track, each with their own ID:

```js
const englishSubtitle = {
  id: 1, // assign a unique numeric ID
  type: 'text',
  subtype: 'subtitles',
  name: 'English Subtitle',
  contentId: 'https://some-url/caption_en.vtt',
  language: 'en-US',
}

const frenchSubtitle = {
  id: 2,
  type: 'text',
  subtype: 'subtitles',
  name: 'French Subtitle',
  contentId: 'https://some-url/caption_fr.vtt',
  language: 'fr',
}

const frenchAudio = {
  id: 3,
  type: 'audio',
  name: 'French Audio',
  contentId: 'trk0001',
  language: 'fr',
}
```

You can then load these tracks by passing them along with other `mediaInfo` when calling `client.loadMedia`:

```js
client.loadMedia({
  mediaInfo: {
    contentUrl: '...',
    mediaTracks: [englishSubtitle, frenchSubtitle, frenchAudio],
  },
})
```

Once loaded, the list of tracks associated with the currently loaded media cannot be changed. If you need to add or remove a track, you have to update the tracks information on the MediaInfo object and reload the media.

## Set active tracks

Your app can activate one or more tracks that were associated with the media item (after the media is loaded), by calling [client.setActiveTrackIds](../api/classes/remotemediaclient#setactivetrackids) and passing the IDs of the tracks to be activated.

> This method was previously called `setActiveMediaTracks` but has been renamed to `setActiveTrackIds` to maintain consistency with other places where it's being used, such as in [MediaQueueItem](../api/interfaces/mediaqueueitem#optional-activetrackids) or [MediaStatus](../api/interfaces/mediastatus#optional-activetrackids).

This example activates the French subtitle and French audio:

```js
// the ID for the French subtitle is '2' and for the French audio '3'
client.setActiveTrackIds([2, 3])
// or to deactivate tracks
client.setActiveTrackIds([])
```

## Style text tracks

[TextTrackStyle](../api/interfaces/texttrackstyle) encapsulates the styling information of a text track. After creating or updating an existing TextTrackStyle, you can apply that style to the currently playing media item by calling [client.setTextTrackStyle](../api/classes/remotemediaclient#settexttrackstyle), like this:

```js
client.setTextTrackStyle(style)
```

Your app should allow users to update the style for text tracks, either using the settings provided by the system or by the app itself.

<!-- There is a default style provided, which you can retrieve using:
TODO add as CastContext.getDefaultTextTrackStyle-->

For example, set the text color to red (`FF0000`) with 50% opacity (`80`) as follows:

```js
const textTrackStyle = {
  foregroundColor: '#FF000080',
}
client.setTextTrackStyle(textTrackStyle)
```

<!-- You should register your app to be notified when system-wide closed caption settings are updated. To this end, you need to implement CaptioningManager.CaptioningChangeListener in your app and register this listener by calling: ->

<!-- CaptioningManager.addCaptioningChangeListener(yourChangeListener); -->

<!-- When your app receives a callback that the caption settings have changed, you would then need to extract the new settings and update the style of the text caption for the media that is currently playing by calling [client.setTextTrackStyle](../api/classes/remotemediaclient#settexttrackstyle) and passing in the new style. -->

## Satisfy CORS requirements

For adaptive media streaming, Google Cast requires the presence of CORS headers, but even simple mp4 media streams require CORS if they include Tracks. If you want to enable Tracks for any media, you must enable CORS for both your track streams and your media streams. So, if you do not have CORS headers available for your simple mp4 media on your server, and you then add a simple subtitle track, you will not be able to stream your media unless you update your server to include the appropriate CORS header. In addition, you need to allow at least the following headers: Content-Type, Accept-Encoding, and Range. Note that the last two headers are additional headers that you may not have been needed previously.
