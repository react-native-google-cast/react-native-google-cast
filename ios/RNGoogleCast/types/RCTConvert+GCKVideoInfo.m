#import "RCTConvert+GCKVideoInfo.h"

#import "RCTConvert+GCKVideoInfoHDRType.h"

@implementation RCTConvert (GCKVideoInfo)

+ (nonnull id)fromGCKVideoInfo:(nullable GCKVideoInfo *)video {
  if (video == nil) return [NSNull null];

  return @{
    @"hdrType" : [RCTConvert fromGCKVideoInfoHDRType:video.hdrType],
    @"height" : @(video.height),
    @"width" : @(video.width),
  };
}

@end
