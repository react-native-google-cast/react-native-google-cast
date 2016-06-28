// Copyright 2015 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

/**
 * @enum GCKMediaControlChannelResumeState
 * Enum defining the media control channel resume state.
 */
typedef NS_ENUM(NSInteger, GCKMediaControlChannelResumeState) {
  /** A resume state indicating that the player state should be left unchanged. */
  GCKMediaControlChannelResumeStateUnchanged = 0,

  /**
   * A resume state indicating that the player should be playing, regardless of its current
   * state.
   */
  GCKMediaControlChannelResumeStatePlay = 1,

  /**
   * A resume state indicating that the player should be paused, regardless of its current
   * state.
   */
  GCKMediaControlChannelResumeStatePause = 2,
};

/**
 * @enum GCKMediaRepeatMode
 * Enum defining the media control channel queue playback repeat modes.
 */
typedef NS_ENUM(NSInteger, GCKMediaRepeatMode) {
  /** A repeat mode indicating that the repeat mode should be left unchanged. */
  GCKMediaRepeatModeUnchanged = 0,

  /** A repeat mode indicating no repeat. */
  GCKMediaRepeatModeOff = 1,

  /** A repeat mode indicating that a single queue item should be played repeatedly. */
  GCKMediaRepeatModeSingle = 2,

  /** A repeat mode indicating that the entire queue should be played repeatedly. */
  GCKMediaRepeatModeAll = 3,

  /**
   * A repeat mode indicating that the entire queue should be played repeatedly. The order of the
   * items will be randomly shuffled once the last item in the queue finishes. The queue will
   * continue to play starting from the first item of the shuffled items.
   */
  GCKMediaRepeatModeAllAndShuffle = 4,
};

/**
 * A constant indicating an invalid time interval. May be passed to methods which accept optional
 * stream positions or time durations.
 */
GCK_EXTERN
const NSTimeInterval kGCKInvalidTimeInterval;
