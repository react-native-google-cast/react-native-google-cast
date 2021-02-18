#import "RCTConvert+GCKMediaStreamType.h"

@implementation RCTConvert (GCKMediaStreamType)

RCT_ENUM_CONVERTER(GCKMediaStreamType, (@{
                     @"buffered" : @(GCKMediaStreamTypeBuffered),
                     @"live" : @(GCKMediaStreamTypeLive),
                     @"none" : @(GCKMediaStreamTypeNone)
                   }),
                   GCKMediaStreamTypeUnknown, integerValue)

+ (nonnull id)fromGCKMediaStreamType:(GCKMediaStreamType)streamType {
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
