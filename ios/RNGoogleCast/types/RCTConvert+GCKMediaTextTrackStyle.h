#ifndef RCTConvert_GCKMediaTextTrackStyle_h
#define RCTConvert_GCKMediaTextTrackStyle_h


#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTextTrackStyle)

+ (GCKMediaTextTrackStyle *)GCKMediaTextTrackStyle:(id)json;
+ (nonnull id)fromGCKMediaTextTrackStyle:(nullable GCKMediaTextTrackStyle *)style;

@end


#endif /* RCTConvert_GCKMediaTextTrackStyle_h */
