// Copyright 2015 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

/**
 * A class containing global objects and state for the Cast SDK.
 * Reserved for future use.
 */
GCK_EXPORT
@interface GCKCastContext : NSObject

/**
 * Returns the singleton instance.
 */
+ (instancetype)sharedInstance;

@end
