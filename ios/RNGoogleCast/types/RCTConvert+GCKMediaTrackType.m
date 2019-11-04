#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTrackType)

RCT_ENUM_CONVERTER(GCKMediaTrackType, (@{
                     @"audio" : @(GCKMediaTrackTypeAudio),
                     @"text" : @(GCKMediaTrackTypeText),
                     @"video" : @(GCKMediaTrackTypeVideo),
                   }),
                   GCKMediaTrackTypeUnknown, integerValue)

+ (id)fromGCKMediaTrackType:(GCKMediaTrackType)trackType {
  switch (trackType) {
  case GCKMediaTrackTypeAudio:
    return @"audio";
  case GCKMediaTrackTypeText:
    return @"text";
  case GCKMediaTrackTypeVideo:
    return @"video";
  default:
    return [NSNull null];
  }
}

@end
