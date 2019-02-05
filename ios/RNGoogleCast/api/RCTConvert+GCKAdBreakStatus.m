#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKAdBreakStatus)

+ (id)fromGCKAdBreakStatus:(GCKAdBreakStatus *)status {
  return @{
    @"currentAdBreakTime" : @(status.currentAdBreakTime),
    @"currentAdBreakClipTime" : @(status.currentAdBreakClipTime),
    @"adBreakId" : status.adBreakID,
    @"adBreakClipId" : status.adBreakClipID,
  };
}

@end
