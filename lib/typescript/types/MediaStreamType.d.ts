declare enum MediaStreamType {
    /** Stored media streamed from an existing data store. */
    BUFFERED = "buffered",
    /** Live media generated on the fly. */
    LIVE = "live",
    /** None of the above. */
    OTHER = "other"
}
export default MediaStreamType;
