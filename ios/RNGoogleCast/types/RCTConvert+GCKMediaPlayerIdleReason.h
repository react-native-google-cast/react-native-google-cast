#ifndef RCTConvert_GCKMediaPlayerIdleReason_h
#define RCTConvert_GCKMediaPlayerIdleReason_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaPlayerIdleReason)

+ (GCKMediaPlayerIdleReason)GCKMediaPlayerIdleReason:(nullable id)json;
+ (nonnull id)fromGCKMediaPlayerIdleReason:(GCKMediaPlayerIdleReason)reason;

@end

#endif /* RCTConvert_GCKMediaPlayerIdleReason_h */
