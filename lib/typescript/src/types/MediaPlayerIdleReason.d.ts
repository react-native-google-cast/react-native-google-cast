/** Possible reason why a media is idle. */
declare enum MediaPlayerIdleReason {
    /** A sender requested to stop playback using the STOP command. */
    CANCELLED = "cancelled",
    /** The media was interrupted due to an error, this could be for example if the player could not download media due to networking errors. */
    ERROR = "error",
    /** The media playback completed. */
    FINISHED = "finished",
    /** A sender requested playing a different media using the LOAD command. */
    INTERRUPTED = "interrupted"
}
export default MediaPlayerIdleReason;
