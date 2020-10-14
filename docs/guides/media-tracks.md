---
id: media-tracks
title: Media Tracks
sidebar_label: Media Tracks
---

[MediaTrack](../api/interfaces/mediatrack) represents a media track, which can be an audio stream, a video stream, or text (such as subtitles or closed caption).

> Note: Currently, the Styled Media Receiver and Default Media Receiver allow you to use only the text tracks with the API. To work with the audio and video tracks, you must develop a Custom Receiver.

## Configure a track

You can configure a track and assign a unique ID to it. The following code creates an English text track, a French text track and a French audio track, each with their own ID:

```js
const englishSubtitle = {
  id: 1,
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

## Group tracks

You can group multiple tracks into a media item, which is represented by [MediaInfo](../api/interfaces/mediainfo). An instance of MediaInfo takes an array of tracks and aggregates other information about the media item. Building on the example, your app can add those three media tracks to a media item by passing a list of those three tracks. Your app needs to associate tracks in a MediaInfo in this way before it loads the media to the receiver.

```js
const mediaInfo = {
  contentUrl: '...',
  mediaTracks: [englishSubtitle, frenchSubtitle, frenchAudio],
}
```

## Remove tracks

TODO

## Update tracks

Your app can activate one or more tracks that were associated with the media item (after the media is loaded), by calling [client.setActiveMediaTracks](../api/classes/remotemediaclient#setactivemediatracks) and passing the IDs of the tracks to be activated. This example activates the French subtitle and French audio:

```js
// the ID for the French subtitle is '2' and for the French audio '3'
client.setActiveMediaTracks([2, 3])
```

## Style text tracks

[TextTrackStyle](../api/interfaces/texttrackstyle) encapsulates the styling information of a text track. After creating or updating an existing TextTrackStyle, you can apply that style to the currently playing media item by calling [client.setTextTrackStyle](../api/classes/remotemediaclient#settexttrackstyle), like this:

```js
client.setTextTrackStyle(style)
```

<!-- Your app should allow users to update the style for text tracks, either using the settings provided by the system or by the app itself. There is a default style provided, which you can retrieve using:

```js
import { useDefaultTextTrackStyle } from 'react-native-google-cast'

const textTrackStyle = useDefaultTextTrackStyle()
``` -->

You can style the following text track style elements:

- Foreground (text) color and opacity
- Background color and opacity
- Edge type
- Edge Color
- Font Scale
- Font Family
- Font Style

For example, set the text color to red (`FF0000`) with 50% opacity (`80`) as follows:

```js
const textTrackStyle = {
  foregroundColor: '#FF000080',
}

// don't forget to update the style afterwards
client.setTextTrackStyle(textTrackStyle)
```

<!-- You should register your app to be notified when system-wide closed caption settings are updated. To this end, you need to implement CaptioningManager.CaptioningChangeListener in your app and register this listener by calling:

CaptioningManager.addCaptioningChangeListener(yourChangeListener);

When your app receives a call back that the caption settings have changed, you would then need to extract the new settings and update the style of the text caption for the media that is currently playing by calling [client.setTextTrackStyle](../api/classes/remotemediaclient#settexttrackstyle) and passing in the new style. -->

## Receive status updates

TODO

<!-- When multiple senders are connected to the same receiver, it is important for each sender to be aware of the changes in the receiver even if those changes were initiated from other senders.

> Note: This is important for all apps, not only those that explicitly support multiple senders, because some Cast devices have control inputs (remotes, buttons) that behave as virtual senders, affecting the status on the receiver.

To this end, your app should register a RemoteMediaClient.Listener and a RemoteMediaClient.ProgressListener.

If the TextTrackStyle of the current media changes, then all of the connected senders will be notified through both of the above registered listeners. In this case, the receiver SDK does not verify whether the new style is different from the previous one and notifies all of the connected senders regardless.

If, however, the status of active tracks changes, only the RemoteMediaClient.ProgressListener in connected senders will be notified.

> Note: The list of tracks associated with the currently loaded media cannot be changed. If needed, you have to update the tracks information on the MediaInfo object and reload the media. -->

## Satisfy CORS requirements

For adaptive media streaming, Google Cast requires the presence of CORS headers, but even simple mp4 media streams require CORS if they include Tracks. If you want to enable Tracks for any media, you must enable CORS for both your track streams and your media streams. So, if you do not have CORS headers available for your simple mp4 media on your server, and you then add a simple subtitle track, you will not be able to stream your media unless you update your server to include the appropriate CORS header. In addition, you need to allow at least the following headers: Content-Type, Accept-Encoding, and Range. Note that the last two headers are additional headers that you may not have been needed previously.
