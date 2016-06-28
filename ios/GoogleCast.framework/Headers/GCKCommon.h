// Copyright 2014 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

/**
 * @file GCKCommon.h
 * GCKCastState, GCKConnectionState, GCKActiveInputStatus, and GCKStandbyStatus enums.
 */

/**
 * An invalid request ID; if a method returns this request ID, it means that the request could
 * not be made.
 */
GCK_EXTERN const NSInteger kGCKInvalidRequestID;

/**
 * A string constant containing the version number of the GoogleCast framework.
 */
GCK_EXTERN const NSString *kGCKFrameworkVersion;

/**
 * @enum GCKConnectionState
 * Enum defining Cast connection states.
 */
typedef NS_ENUM(NSInteger, GCKConnectionState) {
  /** Disconnected from the device or application. */
  GCKConnectionStateDisconnected = 0,
  /** Connecting to the device or application. */
  GCKConnectionStateConnecting = 1,
  /** Connected to the device or application. */
  GCKConnectionStateConnected = 2,
  /** Disconnecting from the device. */
  GCKConnectionStateDisconnecting = 3
};

/**
 * @enum GCKActiveInputStatus
 * An enum describing the active input status states.
 */
typedef NS_ENUM(NSInteger, GCKActiveInputStatus) {
  /**
   * The active input status is unknown.
   */
  GCKActiveInputStatusUnknown = -1,
  /**
   * The input is inactive.
   */
  GCKActiveInputStatusInactive = 0,
  /**
   * The input is active.
   */
  GCKActiveInputStatusActive = 1,
};

/**
 * @enum GCKStandbyStatus
 * An enum describing the standby status states.
 */
typedef NS_ENUM(NSInteger, GCKStandbyStatus) {
  /**
   * The standby status is unknown.
   */
  GCKStandbyStatusUnknown = -1,
  /**
   * The device is not in standby mode.
   */
  GCKStandbyStatusInactive = 0,
  /**
   * The device is in standby mode.
   */
  GCKStandbyStatusActive = 1,
};


/**
 * @enum GCKCastState
 *
 * An enum describing the possible casting states.
 */
typedef NS_ENUM(NSUInteger, GCKCastState) {
  /** No Cast devices are available. */
  GCKCastStateNoDevicesAvailable = 0,
  /** Cast devices are available, but a Cast session is not established. */
  GCKCastStateNotConnected = 1,
  /** A Cast session is being established. */
  GCKCastStateConnecting = 2,
  /** A Cast session is established. */
  GCKCastStateConnected = 3,
};

#define GCK_ASSERT_MAIN_THREAD() \
  NSAssert([NSThread isMainThread], @"%s must be called on main thread", __PRETTY_FUNCTION__)
