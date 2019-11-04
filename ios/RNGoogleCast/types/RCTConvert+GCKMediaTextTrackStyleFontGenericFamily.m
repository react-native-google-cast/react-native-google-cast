#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTextTrackStyleFontGenericFamily)

RCT_ENUM_CONVERTER(
    GCKMediaTextTrackStyleFontGenericFamily, (@{
      @"casual" : @(GCKMediaTextTrackStyleFontGenericFamilyCasual),
      @"cursive" : @(GCKMediaTextTrackStyleFontGenericFamilyCursive),
      @"monoSansSerif" :
          @(GCKMediaTextTrackStyleFontGenericFamilyMonospacedSansSerif),
      @"monoSerif" : @(GCKMediaTextTrackStyleFontGenericFamilyMonospacedSerif),
      @"sansSerif" : @(GCKMediaTextTrackStyleFontGenericFamilySansSerif),
      @"serif" : @(GCKMediaTextTrackStyleFontGenericFamilySerif),
      @"smallCaps" : @(GCKMediaTextTrackStyleFontGenericFamilySmallCapitals),
    }),
    GCKMediaTextTrackStyleFontGenericFamilyUnknown, integerValue)

+ (id)fromGCKMediaTextTrackStyleFontGenericFamily:
    (GCKMediaTextTrackStyleFontGenericFamily)type {
  switch (type) {
  case GCKMediaTextTrackStyleFontGenericFamilyCasual:
    return @"casual";
  case GCKMediaTextTrackStyleFontGenericFamilyCursive:
    return @"cursive";
  case GCKMediaTextTrackStyleFontGenericFamilyMonospacedSansSerif:
    return @"monoSansSerif";
  case GCKMediaTextTrackStyleFontGenericFamilyMonospacedSerif:
    return @"monoSerif";
  case GCKMediaTextTrackStyleFontGenericFamilySansSerif:
    return @"sansSerif";
  case GCKMediaTextTrackStyleFontGenericFamilySerif:
    return @"serif";
  case GCKMediaTextTrackStyleFontGenericFamilySmallCapitals:
    return @"smallCaps";
  default:
    return [NSNull null];
  }
}

@end
