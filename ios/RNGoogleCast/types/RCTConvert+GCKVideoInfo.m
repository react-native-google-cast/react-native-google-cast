#import "RCTConvert+GCKVideoInfoHDRType.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKVideoInfo)

+ (id)fromGCKVideoInfo:(GCKVideoInfo *)video {
  return @{
    @"hdrType" : [RCTConvert fromGCKVideoInfoHDRType:video.hdrType],
    @"height" : @(video.height),
    @"width" : @(video.width),
  };
}

@end
