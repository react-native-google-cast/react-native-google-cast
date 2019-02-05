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

+ (id)fromGCKAdBreakInfo:(GCKAdBreakInfo *)info {
  return @{
    @"adBreakId" : info.adBreakID,
    @"playbackPosition" : @(info.playbackPosition),
    @"adBreakClipIds" : info.adBreakClipIDs,
    @"watched" : @(info.watched),
    @"embedded" : @(info.embedded),
  };
}

@end
