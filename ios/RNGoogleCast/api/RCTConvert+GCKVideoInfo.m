#import "RCTConvert+GCKVideoInfoHDRType.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKVideoInfo)

+ (id)fromGCKVideoInfo:(GCKVideoInfo *)video {
  return @{
    @"width" : @(video.width),
    @"height" : @(video.height),
    @"hdrType" : [RCTConvert fromGCKVideoInfoHDRType:video.hdrType],
  };
}

@end
