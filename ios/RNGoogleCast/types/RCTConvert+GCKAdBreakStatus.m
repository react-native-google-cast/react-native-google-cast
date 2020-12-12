#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKAdBreakStatus)

+ (nonnull id)fromGCKAdBreakStatus:(nullable GCKAdBreakStatus *)status {
  if (status == nil) return [NSNull null];

  return @{
    @"currentAdBreakTime" : @(status.currentAdBreakTime),
    @"currentAdBreakClipTime" : @(status.currentAdBreakClipTime),
    @"adBreakId" : status.adBreakID,
    @"adBreakClipId" : status.adBreakClipID,
  };
}

@end
