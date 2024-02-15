#import "RCTConvert+GCKColor.h"

@implementation RCTConvert (GCKColor)

+ (nullable GCKColor *)GCKColor:(nullable id)json {
  if (json == nil) return nil;

  return [[GCKColor alloc] initWithCSSString:json];
}

+ (nonnull id)fromGCKColor:(nullable GCKColor *)color {
  if (color == nil) return [NSNull null];

  return color.CSSString;
}

@end
