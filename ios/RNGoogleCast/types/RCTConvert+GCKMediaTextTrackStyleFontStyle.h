#ifndef RCTConvert_GCKMediaTextTrackStyleFontStyle_h
#define RCTConvert_GCKMediaTextTrackStyleFontStyle_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaTextTrackStyleFontStyle)

+ (GCKMediaTextTrackStyleFontStyle)GCKMediaTextTrackStyleFontStyle:(nullable id)json;
+ (nonnull id)fromGCKMediaTextTrackStyleFontStyle:
(GCKMediaTextTrackStyleFontStyle)type;

@end

#endif /* RCTConvert_GCKMediaTextTrackStyleFontStyle_h */
