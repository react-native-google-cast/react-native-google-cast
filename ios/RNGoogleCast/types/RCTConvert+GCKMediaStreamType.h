#ifndef RCTConvert_GCKMediaStreamType_h
#define RCTConvert_GCKMediaStreamType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaStreamType)

+ (GCKMediaStreamType)GCKMediaStreamType:(nullable id)json;
+ (nonnull id)fromGCKMediaStreamType:(GCKMediaStreamType)streamType;

@end

#endif /* RCTConvert_GCKMediaStreamType_h */
