#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaResumeState)

RCT_ENUM_CONVERTER(GCKMediaResumeState, (@{
                     @"play" : @(GCKMediaResumeStatePlay),
                     @"pause" : @(GCKMediaResumeStatePause),
                   }),
                   GCKMediaResumeStateUnchanged, integerValue)

+ (id)fromGCKMediaResumeState:(GCKMediaResumeState)state {
  switch (state) {
  case GCKMediaResumeStatePlay:
    return @"play";
  case GCKMediaResumeStatePause:
    return @"pause";
  default:
    return [NSNull null];
  }
}

@end
