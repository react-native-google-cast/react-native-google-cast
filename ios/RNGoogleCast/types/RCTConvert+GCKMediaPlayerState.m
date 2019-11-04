#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaPlayerState)

RCT_ENUM_CONVERTER(GCKMediaPlayerState, (@{
                     @"buffering" : @(GCKMediaPlayerStateBuffering),
                     @"idle" : @(GCKMediaPlayerStateIdle),
                     @"loading" : @(GCKMediaPlayerStateLoading),
                     @"paused" : @(GCKMediaPlayerStatePaused),
                     @"playing" : @(GCKMediaPlayerStatePlaying),
                   }),
                   GCKMediaPlayerStateUnknown, integerValue)

+ (id)fromGCKMediaPlayerState:(GCKMediaPlayerState)state {
  switch (state) {
  case GCKMediaPlayerStateBuffering:
    return @"buffering";
  case GCKMediaPlayerStateIdle:
    return @"idle";
  case GCKMediaPlayerStateLoading:
    return @"loading";
  case GCKMediaPlayerStatePaused:
    return @"paused";
  case GCKMediaPlayerStatePlaying:
    return @"playing";
  default:
    return [NSNull null];
  }
}

@end
