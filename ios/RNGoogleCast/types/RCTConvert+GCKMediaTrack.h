#ifndef RCTConvert_GCKMediaTrack_h
#define RCTConvert_GCKMediaTrack_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTrack)

+ (nonnull GCKMediaTrack *)GCKMediaTrack:(nonnull id)json;
+ (nonnull id)fromGCKMediaTrack:(nullable GCKMediaTrack *)track;

@end

#endif /* RCTConvert_GCKMediaTrack_h */
