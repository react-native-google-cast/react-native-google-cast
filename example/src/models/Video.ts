import { MediaInfo } from 'react-native-google-cast'
import MediaTrack from 'src/types/MediaTrack'

const CAST_VIDEOS_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'

export default class Video {
  duration: number
  imageUrl: string
  dashUrl: string
  hlsUrl: string
  mp4Url: string
  posterUrl: string
  studio: string
  subtitle: string
  title: string
  tracks?: MediaTrack[]

  constructor(params: {
    duration: number
    imageUrl: string
    dashUrl: string
    hlsUrl: string
    mp4Url: string
    posterUrl: string
    studio: string
    subtitle: string
    title: string
    tracks?: MediaTrack[]
  }) {
    this.duration = params.duration
    this.imageUrl = params.imageUrl
    this.dashUrl = params.dashUrl
    this.hlsUrl = params.hlsUrl
    this.mp4Url = params.mp4Url
    this.posterUrl = params.posterUrl
    this.studio = params.studio
    this.subtitle = params.subtitle
    this.title = params.title
    this.tracks = params.tracks
  }

  static async findAll(): Promise<Video[]> {
    const response = await fetch(CAST_VIDEOS_URL)
    const data = await response.json()

    const dashPrefix = data.categories[0].dash
    const hlsPrefix = data.categories[0].hls
    const mp4Prefix = data.categories[0].mp4
    const imagesPrefix = data.categories[0].images
    const tracksPrefix = data.categories[0].tracks

    return data.categories[0].videos.map(
      (v: {
        'subtitle': string
        'sources': Array<{ type: string; mime: string; url: string }>
        'thumb': string
        'image-480x270': string
        'image-780x1200': string
        'title': string
        'studio': string
        'duration': number
        'tracks'?: Array<MediaTrack & { id: string }>
      }) =>
        new Video({
          title: v.title,
          subtitle: v.subtitle,
          studio: v.studio,
          duration: v.duration,
          dashUrl: dashPrefix + v.sources.find((s) => s.type === 'dash')?.url,
          hlsUrl: hlsPrefix + v.sources.find((s) => s.type === 'hls')?.url,
          mp4Url: mp4Prefix + v.sources.find((s) => s.type === 'mp4')?.url,
          imageUrl: imagesPrefix + v['image-480x270'],
          posterUrl: imagesPrefix + v['image-780x1200'],
          tracks: v.tracks?.map((t) => ({
            ...t,
            contentId: tracksPrefix + t.contentId,
            id: Number.parseInt(t.id, 10),
          })),
        })
    )
  }

  toMediaInfo(): MediaInfo {
    return {
      contentUrl: this.mp4Url,
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
