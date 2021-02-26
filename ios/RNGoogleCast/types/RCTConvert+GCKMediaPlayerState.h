#ifndef RCTConvert_GCKMediaPlayerState_h
#define RCTConvert_GCKMediaPlayerState_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaPlayerState)

+ (GCKMediaPlayerState)GCKMediaPlayerState:(nullable id)json;
+ (nonnull id)fromGCKMediaPlayerState:(GCKMediaPlayerState)state;

@end

#endif /* RCTConvert_GCKMediaPlayerState_h */
