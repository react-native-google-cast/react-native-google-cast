// Copyright 2013 Google Inc.

#import <GoogleCast/GCKDefines.h>

/**
 * A class that represents an image that is located on a web server.
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKImage : NSObject <NSCopying, NSCoding>

/**
 * The image URL.
 */
@property(nonatomic, readonly, strong) NSURL *URL;

/**
 * The image width, in pixels.
 */
@property(nonatomic, readonly) NSInteger width;

/**
 * The image height, in pixels.
 */
@property(nonatomic, readonly) NSInteger height;

/**
 * Constructs a new {@link GCKImage} with the given URL and dimensions. Designated initializer.
 * Asserts that the URL is not be null or empty, and the dimensions are not invalid.
 *
 * @param URL The URL of the image.
 * @param width The width of the image, in pixels.
 * @param height The height of the image, in pixels.
 */
- (instancetype)initWithURL:(NSURL *)URL width:(NSInteger)width height:(NSInteger)height;

@end
