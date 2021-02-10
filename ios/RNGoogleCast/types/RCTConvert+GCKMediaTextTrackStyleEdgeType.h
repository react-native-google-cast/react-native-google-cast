#ifndef RCTConvert_GCKMediaTextTrackStyleEdgeType_h
#define RCTConvert_GCKMediaTextTrackStyleEdgeType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTextTrackStyleEdgeType)

+ (GCKMediaTextTrackStyleEdgeType)GCKMediaTextTrackStyleEdgeType:(id)json;
+ (nonnull id)fromGCKMediaTextTrackStyleEdgeType:(GCKMediaTextTrackStyleEdgeType)type;

@end

#endif /* RCTConvert_GCKMediaTextTrackStyleEdgeType_h */
