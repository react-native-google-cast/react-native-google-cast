#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTextTrackSubtype)

RCT_ENUM_CONVERTER(GCKMediaTextTrackSubtype, (@{
                     @"Captions" : @(GCKMediaTextTrackSubtypeCaptions),
                     @"Chapters" : @(GCKMediaTextTrackSubtypeChapters),
                     @"Descriptions" : @(GCKMediaTextTrackSubtypeDescriptions),
                     @"Metadata" : @(GCKMediaTextTrackSubtypeMetadata),
                     @"Subtitles" : @(GCKMediaTextTrackSubtypeSubtitles),
                   }),
                   GCKMediaTextTrackSubtypeUnknown, integerValue)

+ (id)fromGCKMediaTextTrackSubtype:(GCKMediaTextTrackSubtype)subtype {
  switch (subtype) {
  case GCKMediaTextTrackSubtypeCaptions:
    return @"Captions";
  case GCKMediaTextTrackSubtypeChapters:
    return @"Chapters";
  case GCKMediaTextTrackSubtypeDescriptions:
    return @"Descriptions";
  case GCKMediaTextTrackSubtypeMetadata:
    return @"Metadata";
  case GCKMediaTextTrackSubtypeSubtitles:
    return @"Subtitles";
  default:
    return nil;
  }
}

@end
