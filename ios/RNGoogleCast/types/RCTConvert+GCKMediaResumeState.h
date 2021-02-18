#ifndef RCTConvert_GCKMediaResumeState_h
#define RCTConvert_GCKMediaResumeState_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaResumeState)

+ (GCKMediaResumeState)GCKMediaResumeState:(nullable id)json;
+ (nonnull id)fromGCKMediaResumeState:(GCKMediaResumeState)state;

@end

#endif /* RCTConvert_GCKMediaResumeState_h */
