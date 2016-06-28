// Copyright 2013 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

@class GCKSenderApplicationInfo;

/**
 * Information about a first-screen application.
 *
 * @ingroup Applications
 */
GCK_EXPORT
@interface GCKApplicationMetadata : NSObject<NSCopying>

/** The application's ID. */
@property(nonatomic, copy, readonly) NSString *applicationID;

/** The application's name. */
@property(nonatomic, copy, readonly) NSString *applicationName;

/** The application GCKImage images. */
@property(nonatomic, copy, readonly) NSArray *images;

/**
 * The set of namespaces supported by this application.
 */
@property(nonatomic, copy, readonly) NSArray *namespaces;

/**
 * Information about the sender application that is the counterpart to the receiver application,
 * if any.
 */
@property(nonatomic, copy, readonly) GCKSenderApplicationInfo *senderApplicationInfo;

/**
 * The identifier of the sender application that is the counterpart to the receiver
 * application, if any.
 */
- (NSString *)senderAppIdentifier;

/**
 * The launch URL for the sender application that is the counterpart to the receiver
 * application, if any.
 */
- (NSURL *)senderAppLaunchURL;

@end
