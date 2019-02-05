#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaResumeState)

RCT_ENUM_CONVERTER(GCKMediaResumeState, (@{
                     @"Play" : @(GCKMediaResumeStatePlay),
                     @"Pause" : @(GCKMediaResumeStatePause),
                   }),
                   GCKMediaResumeStateUnchanged, integerValue)

+ (id)fromGCKMediaResumeState:(GCKMediaResumeState)state {
  switch (state) {
  case GCKMediaResumeStatePlay:
    return @"Play";
  case GCKMediaResumeStatePause:
    return @"Pause";
  default:
    return nil;
  }
}

@end
