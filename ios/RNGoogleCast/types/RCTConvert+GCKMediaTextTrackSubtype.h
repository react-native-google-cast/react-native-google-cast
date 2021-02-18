#ifndef RCTConvert_GCKMediaTextTrackSubtype_h
#define RCTConvert_GCKMediaTextTrackSubtype_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTextTrackSubtype)

+ (GCKMediaTextTrackSubtype)GCKMediaTextTrackSubtype:(nullable id)json;
+ (nonnull id)fromGCKMediaTextTrackSubtype:(GCKMediaTextTrackSubtype)subtype;

@end

#endif /* RCTConvert_GCKMediaTextTrackSubtype_h */
