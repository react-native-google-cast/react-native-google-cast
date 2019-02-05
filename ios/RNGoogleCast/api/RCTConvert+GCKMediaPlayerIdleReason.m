#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaPlayerIdleReason)

RCT_ENUM_CONVERTER(GCKMediaPlayerIdleReason, (@{
                     @"Cancelled" : @(GCKMediaPlayerIdleReasonCancelled),
                     @"Error" : @(GCKMediaPlayerIdleReasonError),
                     @"Finished" : @(GCKMediaPlayerIdleReasonFinished),
                     @"Interrupted" : @(GCKMediaPlayerIdleReasonInterrupted),
                   }),
                   GCKMediaPlayerIdleReasonNone, integerValue)

+ (id)fromGCKMediaPlayerIdleReason:(GCKMediaPlayerIdleReason)reason {
  switch (reason) {
  case GCKMediaPlayerIdleReasonCancelled:
    return @"Cancelled";
  case GCKMediaPlayerIdleReasonError:
    return @"Error";
  case GCKMediaPlayerIdleReasonFinished:
    return @"Finished";
  case GCKMediaPlayerIdleReasonInterrupted:
    return @"Interrupted";
  default:
    return nil;
  }
}

@end
