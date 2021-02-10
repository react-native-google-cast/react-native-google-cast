#ifndef RCTConvert_GCKMediaRepeatMode_h
#define RCTConvert_GCKMediaRepeatMode_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaRepeatMode)

+ (GCKMediaRepeatMode)GCKMediaRepeatMode:(nullable id)json;
+ (nonnull id)fromGCKMediaRepeatMode:(GCKMediaRepeatMode)mode;

@end

#endif /* RCTConvert_GCKMediaRepeatMode_h */
