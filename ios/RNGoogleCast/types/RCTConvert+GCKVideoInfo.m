#import "RCTConvert+GCKVideoInfoHDRType.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

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
