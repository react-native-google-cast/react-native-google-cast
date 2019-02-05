#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaPlayerState)

RCT_ENUM_CONVERTER(GCKMediaPlayerState, (@{
                     @"Buffering" : @(GCKMediaPlayerStateBuffering),
                     @"Idle" : @(GCKMediaPlayerStateIdle),
                     @"Loading" : @(GCKMediaPlayerStateLoading),
                     @"Paused" : @(GCKMediaPlayerStatePaused),
                     @"Playing" : @(GCKMediaPlayerStatePlaying),
                   }),
                   GCKMediaPlayerStateUnknown, integerValue)

+ (id)fromGCKMediaPlayerState:(GCKMediaPlayerState)state {
  switch (state) {
  case GCKMediaPlayerStateBuffering:
    return @"Buffering";
  case GCKMediaPlayerStateIdle:
    return @"Idle";
  case GCKMediaPlayerStateLoading:
    return @"Loading";
  case GCKMediaPlayerStatePaused:
    return @"Paused";
  case GCKMediaPlayerStatePlaying:
    return @"Playing";
  default:
    return nil;
  }
}

@end
