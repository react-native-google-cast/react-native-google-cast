export interface MediaSeekOptions {
    /** Custom application-specific data to pass along with the request. */
    customData?: object;
    /** Whether seek to end of stream or live. */
    infinite?: boolean;
    /** The position to seek to, in seconds from the beginning of the stream. Ignored if `infinite` is `true`. */
    position?: number;
    /** Whether the time interval is relative to the current stream position (`true`) or to the beginning of the stream (`false`). The default value is `false`, indicating an absolute seek position. */
    relative?: boolean;
    /** The action to take after the seek operation has finished. If not specified, it will preserve current play state. */
    resumeState?: 'play' | 'pause';
}
