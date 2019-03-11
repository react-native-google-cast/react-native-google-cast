import React from 'react'
import {
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  Platform,
  SectionList,
  ToolbarAndroid,
  TouchableOpacity,
} from 'react-native'

import {
  CastButton,
  MediaInfo,
  MediaLoadOptions,
  MediaMetadata,
  RemoteMediaClient,
  WebImage,
} from 'react-native-google-cast'

export default class Formats extends React.Component {
  cast(item) {
    RemoteMediaClient.loadMedia(
      item.mediaInfo,
      new MediaLoadOptions({ autoplay: true }),
    )
      .then(console.log)
      .catch(console.warn)
  }

  render() {
    return (
      <SectionList
        renderItem={({ item, index }) => (
          <Button
            key={index}
            testID={item.title}
            onPress={() => this.cast(item)}
            title={item.title}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ fontWeight: 'bold' }}>{title}</Text>
        )}
        sections={[
          {
            title: 'Images',
            data: [
              {
                title: 'BMP',
                mediaInfo: new MediaInfo({
                  contentId:
                    'http://eeweb.poly.edu/~yao/EL5123/image/lena_gray.bmp',
                  contentType: 'image/bmp',
                }),
              },
              {
                title: 'PNG',
                mediaInfo: new MediaInfo({
                  contentId:
                    'https://sample-videos.com/img/Sample-png-image-500kb.png',
                  contentType: 'image/png',
                }),
              },
            ],
          },
          {
            title: 'Videos',
            data: [
              {
                title: 'MP4',
                mediaInfo: new MediaInfo({
                  contentId:
                    'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/car-20120827-87.mp4',
                  contentType: 'application/mp4',
                }),
              },
            ],
          },
          {
            title: 'Adaptive Streaming',
            data: [
              {
                title: 'DASH',
                mediaInfo: new MediaInfo({
                  contentId:
                    'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/car-20120827-manifest.mpd',
                  contentType: 'video/webm',
                }),
              },
              {
                title: 'HLS',
                mediaInfo: new MediaInfo({
                  contentId:
                    'https://mnmedias.api.telequebec.tv/m3u8/29880.m3u8',
                  contentType: 'application/x-mpegURL',
                }),
              },
            ],
          },
        ]}
        keyExtractor={(item, index) => item + index}
      />
    )
  }
}
