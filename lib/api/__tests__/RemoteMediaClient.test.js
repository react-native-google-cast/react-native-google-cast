const WebSocket = require('ws')
const RemoteMediaClient = require('../RemoteMediaClient')

const ws = new WebSocket('ws://192.168.0.103:57686')

describe('RemoteMediaClient', () => {
  it('sends basic load media request', async done => {
    RemoteMediaClient.loadMedia(
      new MediaInfo({
        contentId: video.mediaUrl,
      }),
    )

    ws.on('message', message => {
      console.log(message)
      done()
    })
  })

  // it('with metadata', async () => {
  //   RemoteMediaClient.loadMedia(
  //     new MediaInfo({
  //       contentId: video.mediaUrl,
  //       metadata: new MediaMetadata.Movie({
  //         images: [
  //           new WebImage({ url: video.imageUrl, width: 480, height: 270 }),
  //           new WebImage({ url: video.posterUrl, width: 780, height: 1200 }),
  //         ],
  //         subtitle: video.subtitle,
  //         title: video.title,
  //       }),
  //       streamDuration: video.duration,
  //     }),
  //     new MediaLoadOptions({ autoplay: true }),
  //   )
  // })
})
