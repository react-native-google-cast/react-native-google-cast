#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaStreamType)

RCT_ENUM_CONVERTER(GCKMediaStreamType, (@{
                     @"Buffered" : @(GCKMediaStreamTypeBuffered),
                     @"Live" : @(GCKMediaStreamTypeLive),
                     @"None" : @(GCKMediaStreamTypeNone)
                   }),
                   GCKMediaStreamTypeUnknown, integerValue)

+ (id)fromGCKMediaStreamType:(GCKMediaStreamType)streamType {
  switch (streamType) {
  case GCKMediaStreamTypeBuffered:
    return @"Buffered";
  case GCKMediaStreamTypeLive:
    return @"Live";
  case GCKMediaStreamTypeNone:
    return @"None";
  default:
    return nil;
  }
}

@end
