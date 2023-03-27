#import "RCTConvert+GCKMediaLiveSeekableRange.h"


@implementation RCTConvert (GCKMediaLiveSeekableRange)

+ (nonnull id)fromGCKMediaLiveSeekableRange:(nullable GCKMediaLiveSeekableRange *)info {
  if (info == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"startTime"] = @(info.startTime);
  json[@"endTime"] = @(info.endTime);
  json[@"isMovingWindow"] = @(info.isMovingWindow);
  json[@"isLiveDone"] = @(info.isLiveDone);

  return json;
}

@end
