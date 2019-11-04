#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTextTrackStyleFontStyle)

RCT_ENUM_CONVERTER(GCKMediaTextTrackStyleFontStyle, (@{
                     @"bold" : @(GCKMediaTextTrackStyleFontStyleBold),
                     @"boldItalic" :
                         @(GCKMediaTextTrackStyleFontStyleBoldItalic),
                     @"italic" : @(GCKMediaTextTrackStyleFontStyleItalic),
                     @"normal" : @(GCKMediaTextTrackStyleFontStyleNormal),
                   }),
                   GCKMediaTextTrackStyleFontStyleUnknown, integerValue)

+ (id)fromGCKMediaTextTrackStyleFontStyle:
    (GCKMediaTextTrackStyleFontStyle)type {
  switch (type) {
  case GCKMediaTextTrackStyleFontStyleBold:
    return @"bold";
  case GCKMediaTextTrackStyleFontStyleBoldItalic:
    return @"boldItalic";
  case GCKMediaTextTrackStyleFontStyleItalic:
    return @"italic";
  case GCKMediaTextTrackStyleFontStyleNormal:
    return @"normal";
  default:
    return [NSNull null];
  }
}

@end
