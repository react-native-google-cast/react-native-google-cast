import { MediaInfo } from 'react-native-google-cast'

const CAST_VIDEOS_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'

export default class Video {
  duration: number
  imageUrl: string
  mediaUrl: string
  posterUrl: string
  studio: string
  subtitle: string
  title: string

  constructor(params: {
    duration: number
    imageUrl: string
    mediaUrl: string
    posterUrl: string
    studio: string
    subtitle: string
    title: string
  }) {
    this.duration = params.duration
    this.imageUrl = params.imageUrl
    this.mediaUrl = params.mediaUrl
    this.posterUrl = params.posterUrl
    this.studio = params.studio
    this.subtitle = params.subtitle
    this.title = params.title
  }

  static async findAll(): Promise<Video[]> {
    const response = await fetch(CAST_VIDEOS_URL)
    const data = await response.json()

    const mp4Url = data.categories[0].mp4
    const imagesUrl = data.categories[0].images

    return data.categories[0].videos.map(
      (v: any) =>
        new Video({
          title: v.title,
          subtitle: v.subtitle,
          studio: v.studio,
          duration: v.duration,
          mediaUrl: mp4Url + v.sources[2].url,
          imageUrl: imagesUrl + v['image-480x270'],
          posterUrl: imagesUrl + v['image-780x1200'],
        })
    )
  }

  toMediaInfo(): MediaInfo {
    return {
      contentUrl: this.mediaUrl,
      metadata: {
        images: [
          { url: this.imageUrl, width: 480, height: 270 },
          { url: this.posterUrl, width: 780, height: 1200 },
        ],
        studio: this.studio,
        subtitle: this.subtitle,
        title: this.title,
        type: 'movie',
      },
      streamDuration: this.duration,
    }
  }
}
