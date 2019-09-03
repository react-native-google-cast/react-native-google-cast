#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKColor)

+ (GCKColor *)GCKColor:(id)json {
  return [[GCKColor alloc] initWithCSSString:json];
}

+ (id)fromGCKColor:(GCKColor *)color {
  return color.CSSString;
}

@end
