const CAST_VIDEOS_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/f.json'

export default class Video {
  static async findAll(): Promise<Video[]> {
    const response = await fetch(CAST_VIDEOS_URL)
    const data = await response.json()

    const mp4Url = data.categories[0].mp4
    const imagesUrl = data.categories[0].images

    return data.categories[0].videos.map(video => ({
      title: video.title,
      subtitle: video.subtitle,
      studio: video.studio,
      duration: video.duration,
      mediaUrl: mp4Url + video.sources[2].url,
      imageUrl: imagesUrl + video['image-480x270'],
      posterUrl: imagesUrl + video['image-780x1200'],
    }))
  }

  duration: string
  imageUrl: string
  mediaUrl: string
  posterUrl: string
  studio: string
  subtitle: string
  title: string
}
