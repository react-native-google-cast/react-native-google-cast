#ifndef RCTConvert_GCKMediaTrackType_h
#define RCTConvert_GCKMediaTrackType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTrackType)

+ (GCKMediaTrackType)GCKMediaTrackType:(nullable id)json;
+ (nonnull id)fromGCKMediaTrackType:(GCKMediaTrackType)trackType;

@end

#endif /* RCTConvert_GCKMediaTrackType_h */
