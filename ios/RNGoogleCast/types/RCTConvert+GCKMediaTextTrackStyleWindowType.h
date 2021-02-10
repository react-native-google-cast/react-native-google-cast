#ifndef RCTConvert_GCKMediaTextTrackStyleWindowType_h
#define RCTConvert_GCKMediaTextTrackStyleWindowType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTextTrackStyleWindowType)

+ (GCKMediaTextTrackStyleWindowType)GCKMediaTextTrackStyleWindowType:(nullable id)json;
+ (nonnull id)fromGCKMediaTextTrackStyleWindowType:
(GCKMediaTextTrackStyleWindowType)type;

@end

#endif /* RCTConvert_GCKMediaTextTrackStyleWindowType_h */
