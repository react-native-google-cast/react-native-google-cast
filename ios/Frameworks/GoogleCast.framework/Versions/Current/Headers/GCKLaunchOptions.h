// Copyright 2014 Google Inc.

#import <GoogleCast/GCKDefines.h>

/**
 * Receiver application launch options.
 *
 * @ingroup DeviceControl
 */
GCK_EXPORT
@interface GCKLaunchOptions : NSObject<NSCopying, NSCoding>

/** The sender's language code as per RFC 5646. The default is the system's language. */
@property(nonatomic, copy) NSString *languageCode;

/**
 * A flag indicating whether the receiver application should be relaunched if it is already
 * running. The default is <code>NO</code>.
 */
@property(nonatomic) BOOL relaunchIfRunning;

/** Initializes the object with default values. */
- (instancetype)init;

/** Initializes the object with the system's language and the given relaunch behavior. */
- (instancetype)initWithRelaunchIfRunning:(BOOL)relaunchIfRunning;

/** Designated initializer. */
- (instancetype)initWithLanguageCode:(NSString *)languageCode
                   relaunchIfRunning:(BOOL)relaunchIfRunning;

@end
