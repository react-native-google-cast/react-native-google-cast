/** Possible states of queue repeat mode. */
declare enum MediaRepeatMode {
    /** The items in the queue will be played indefinitely. When the last item has ended, the first item will be played again. */
    ALL = "all",
    /** The items in the queue will be played indefinitely. When the last item has ended, the list of items will be randomly shuffled by the receiver, and the queue will continue to play starting from the first item of the shuffled items. */
    ALL_AND_SHUFFLE = "allAndShuffle",
    /** Items are played in order, and when the queue is completed (the last item has ended) the media session is terminated. */
    OFF = "off",
    /** The current item will be repeated indefinitely. */
    SINGLE = "single"
}
export default MediaRepeatMode;
