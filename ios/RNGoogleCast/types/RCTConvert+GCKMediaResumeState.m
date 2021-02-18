#import "RCTConvert+GCKMediaResumeState.h"

@implementation RCTConvert (GCKMediaResumeState)

RCT_ENUM_CONVERTER(GCKMediaResumeState, (@{
                     @"play" : @(GCKMediaResumeStatePlay),
                     @"pause" : @(GCKMediaResumeStatePause),
                   }),
                   GCKMediaResumeStateUnchanged, integerValue)

+ (nonnull id)fromGCKMediaResumeState:(GCKMediaResumeState)state {
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
