#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaStreamType)

RCT_ENUM_CONVERTER(GCKMediaStreamType, (@{
                     @"buffered" : @(GCKMediaStreamTypeBuffered),
                     @"live" : @(GCKMediaStreamTypeLive),
                     @"none" : @(GCKMediaStreamTypeNone)
                   }),
                   GCKMediaStreamTypeUnknown, integerValue)

+ (id)fromGCKMediaStreamType:(GCKMediaStreamType)streamType {
  switch (streamType) {
  case GCKMediaStreamTypeBuffered:
    return @"buffered";
  case GCKMediaStreamTypeLive:
    return @"live";
  case GCKMediaStreamTypeNone:
    return @"none";
  default:
    return [NSNull null];
  }
}

@end
