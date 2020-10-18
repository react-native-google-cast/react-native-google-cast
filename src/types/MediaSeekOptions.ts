export interface MediaSeekOptions {
  /** Custom application-specific data to pass along with the request. */
  customData?: object

  /** Whether seek to end of stream or live. _On iOS, only supported from SDK v4.4.1._ */
  infinite?: boolean

  /** The position to seek to, in milliseconds from the beginning of the stream. Ignored if `infinite` is `true`. */
  position?: number

  /** The action to take after the seek operation has finished. If not specified, it will preserve current play state. */
  resumeState?: 'play' | 'pause'
}
