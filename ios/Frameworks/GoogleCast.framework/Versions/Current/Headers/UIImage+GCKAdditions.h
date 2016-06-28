// Copyright 2015 Google Inc.

#if TARGET_OS_IPHONE

#import <UIKit/UIKit.h>

/**
 * A category on UIImage that adds some useful functionality.
 */
@interface UIImage (GCKAdditions)

/**
 * Returns a version of the image that is tinted with the given color.
 *
 * @param color The tint color.
 */
- (UIImage *)gck_imageWithTintColor:(UIColor *)color;

/**
 * Returns a version of the image that has been scaled to fit the given size. The aspect ratio of
 * the image is maintained.
 *
 * @param size The new bounding size.
 */
- (UIImage *)gck_imageScaledToFitSize:(CGSize)size;

/**
 * Returns a version of the image that has been scaled to the given width. The aspect ratio of the
 * image is maintained.
 *
 * @param width The new width.
 */
- (UIImage *)gck_imageScaledToWidth:(CGFloat)width;

/**
 * Returns a version of the image that has been scaled to the given height. The aspect ratio of the
 * image is maintained.
 *
 * @param height The new height.
 */
- (UIImage *)gck_imageScaledToHeight:(CGFloat)height;

/**
 * Returns a version of the image that has been scaled to the given size. The resulting image may
 * be stretched along one axis to fill the given size.
 *
 * @param size The new size.
 */
- (UIImage *)gck_imageScaledToSize:(CGSize)size;

@end

#endif  // TARGET_OS_IPHONE
