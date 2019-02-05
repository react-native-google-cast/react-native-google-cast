#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTrackType)

RCT_ENUM_CONVERTER(GCKMediaTrackType, (@{
                     @"Audio" : @(GCKMediaTrackTypeAudio),
                     @"Text" : @(GCKMediaTrackTypeText),
                     @"Video" : @(GCKMediaTrackTypeVideo),
                   }),
                   GCKMediaTrackTypeUnknown, integerValue)

+ (id)fromGCKMediaTrackType:(GCKMediaTrackType)trackType {
  switch (trackType) {
  case GCKMediaTrackTypeAudio:
    return @"Audio";
  case GCKMediaTrackTypeText:
    return @"Text";
  case GCKMediaTrackTypeVideo:
    return @"Video";
  default:
    return nil;
  }
}

@end
