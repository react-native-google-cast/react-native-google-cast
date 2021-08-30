import { MediaInfo } from 'react-native-google-cast';
import MediaTrack from 'src/types/MediaTrack';
export default class Video {
    duration: number;
    imageUrl: string;
    dashUrl: string;
    hlsUrl: string;
    mp4Url: string;
    posterUrl: string;
    studio: string;
    subtitle: string;
    title: string;
    tracks?: MediaTrack[];
    constructor(params: {
        duration: number;
        imageUrl: string;
        dashUrl: string;
        hlsUrl: string;
        mp4Url: string;
        posterUrl: string;
        studio: string;
        subtitle: string;
        title: string;
        tracks?: MediaTrack[];
    });
    static findAll(): Promise<Video[]>;
    toMediaInfo(): MediaInfo;
}
