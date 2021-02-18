#import "RCTConvert+GCKColor.h"

@implementation RCTConvert (GCKColor)

+ (GCKColor *)GCKColor:(id)json {
  return [[GCKColor alloc] initWithCSSString:json];
}

+ (nonnull id)fromGCKColor:(nullable GCKColor *)color {
  if (color == nil) return [NSNull null];
  
  return color.CSSString;
}

@end
