#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKAdBreakInfo)

+ (GCKAdBreakInfo *)GCKAdBreakInfo:(id)json {
  GCKAdBreakInfo *info = [[GCKAdBreakInfo alloc]
      initWithPlaybackPosition:[RCTConvert
                                   NSTimeInterval:json[@"playbackPosition"]]];

  // TODO use builder in 4.3.4
  
  return info;
}

+ (nonnull id)fromGCKAdBreakInfo:(nullable GCKAdBreakInfo *)info {
  if (info == nil) return [NSNull null];

  return @{
    @"adBreakId" : info.adBreakID,
    @"playbackPosition" : @(info.playbackPosition),
    @"adBreakClipIds" : info.adBreakClipIDs,
    @"watched" : @(info.watched),
    @"embedded" : @(info.embedded),
  };
}

@end
