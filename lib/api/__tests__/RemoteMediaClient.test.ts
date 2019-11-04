import WebSocket from 'ws'
import GoogleCast from '../..'
import RemoteMediaClient from '../RemoteMediaClient'

const ws = new WebSocket('ws://192.168.0.104:57686')

describe('RemoteMediaClient', () => {
  let client: RemoteMediaClient

  beforeEach(async () => {
    client = await GoogleCast.getClient()
  })

  it('sends basic load media request', async done => {
    client.loadMedia({
      contentUrl: video.mediaUrl,
    })

    ws.on('message', message => {
      console.log(message)
      done()
    })
  })

  it('with metadata', async () => {
    client.loadMedia(
      {
        contentUrl: video.mediaUrl,
        metadata: {
          type: 'movie',
          images: [
            { url: video.imageUrl, width: 480, height: 270 },
            { url: video.posterUrl, width: 780, height: 1200 },
          ],
          subtitle: video.subtitle,
          title: video.title,
        },
        streamDuration: video.duration,
      },
      { autoplay: true }
    )
  })
})
