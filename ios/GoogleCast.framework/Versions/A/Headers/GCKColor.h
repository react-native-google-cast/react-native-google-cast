// Copyright 2013 Google Inc.

#if TARGET_OS_IPHONE
#include <UIKit/UIColor.h>
#else
#include <AppKit/NSColor.h>
#endif

#import <GoogleCast/GCKDefines.h>

/**
 * A class that represents an RGBA color.
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKColor : NSObject <NSCopying, NSCoding>

@property(nonatomic, readonly) CGFloat red;
@property(nonatomic, readonly) CGFloat green;
@property(nonatomic, readonly) CGFloat blue;
@property(nonatomic, readonly) CGFloat alpha;

/**
 * Designated initializer. Constructs a GCKColor object with the given red, green, blue, and alpha
 * values.
 */
- (instancetype)initWithRed:(CGFloat)red
                      green:(CGFloat)green
                       blue:(CGFloat)blue
                      alpha:(CGFloat)alpha;


/**
 * Constructs a GCKColor object with the given red, green, blue values and an alpha value of 1.0
 * (full opacity).
 */
- (instancetype)initWithRed:(CGFloat)red
                      green:(CGFloat)green
                       blue:(CGFloat)blue;

#if TARGET_OS_IPHONE

/**
 * Constructs a GCKColor object from a UIColor.
 */
- (instancetype)initWithUIColor:(UIColor *)color;

#else

/**
 * Constructs a GCKColor object from an NSColor.
 */
- (instancetype)initWithNSColor:(NSColor *)color;

#endif // TARGET_OS_IPHONE

/**
 * Constructs a GCKColor object from a CGColor.
 */
- (instancetype)initWithCGColor:(CGColorRef)color;

/**
 * Constructs a GCKColor object from a CSS string representation in the form "#RRGGBBAA".
 */
- (instancetype)initWithCSSString:(NSString *)CSSString;

/**
 * Returns a CSS string representation of the color, in the form "#RRGGBBAA".
 */
- (NSString *)CSSString;

/** The color black. */
+ (GCKColor *)black;
/** The color red. */
+ (GCKColor *)red;
/** The color green. */
+ (GCKColor *)green;
/** The color blue. */
+ (GCKColor *)blue;
/** The color cyan. */
+ (GCKColor *)cyan;
/** The color magenta. */
+ (GCKColor *)magenta;
/** The color yellow. */
+ (GCKColor *)yellow;
/** The color white. */
+ (GCKColor *)white;

@end
