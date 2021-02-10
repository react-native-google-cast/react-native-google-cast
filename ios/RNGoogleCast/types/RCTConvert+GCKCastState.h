#ifndef RCTConvert_GCKCastState_h
#define RCTConvert_GCKCastState_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKCastState)

+ (nonnull id)fromGCKCastState:(GCKCastState)state;

@end

#endif /* RCTConvert_GCKCastState_h */
