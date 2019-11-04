#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTextTrackSubtype)

RCT_ENUM_CONVERTER(GCKMediaTextTrackSubtype, (@{
                     @"captions" : @(GCKMediaTextTrackSubtypeCaptions),
                     @"chapters" : @(GCKMediaTextTrackSubtypeChapters),
                     @"descriptions" : @(GCKMediaTextTrackSubtypeDescriptions),
                     @"metadata" : @(GCKMediaTextTrackSubtypeMetadata),
                     @"subtitles" : @(GCKMediaTextTrackSubtypeSubtitles),
                   }),
                   GCKMediaTextTrackSubtypeUnknown, integerValue)

+ (id)fromGCKMediaTextTrackSubtype:(GCKMediaTextTrackSubtype)subtype {
  switch (subtype) {
  case GCKMediaTextTrackSubtypeCaptions:
    return @"captions";
  case GCKMediaTextTrackSubtypeChapters:
    return @"chapters";
  case GCKMediaTextTrackSubtypeDescriptions:
    return @"descriptions";
  case GCKMediaTextTrackSubtypeMetadata:
    return @"metadata";
  case GCKMediaTextTrackSubtypeSubtitles:
    return @"subtitles";
  default:
    return [NSNull null];
  }
}

@end
