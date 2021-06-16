/** Possible states of the media player. */
declare enum MediaPlayerState {
    /** Player is in PLAY mode but not actively playing content. currentTime will not change. */
    BUFFERING = "buffering",
    /** No media is loaded into the player. */
    IDLE = "idle",
    /** The media is loading. */
    LOADING = "loading",
    /** The media is not playing. */
    PAUSED = "paused",
    /** The media is playing. */
    PLAYING = "playing"
}
export default MediaPlayerState;
