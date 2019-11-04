#import "RCTConvert+GCKMediaRepeatMode.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueLoadOptions)

+ (GCKMediaQueueLoadOptions *)GCKMediaQueueLoadOptions:(id)json {
  GCKMediaQueueLoadOptions *options = [[GCKMediaQueueLoadOptions alloc] init];

  if (json[@"startIndex"]) {
    options.startIndex = [RCTConvert NSUInteger:json[@"startIndex"]];
  }
  if (json[@"playPosition"]) {
    options.playPosition = [RCTConvert NSTimeInterval:json[@"playPosition"]];
  }
  if (json[@"repeatMode"]) {
    options.repeatMode = [RCTConvert GCKMediaRepeatMode:json[@"repeatMode"]];
  }
  if (json[@"customData"]) {
    options.customData = [RCTConvert id:json[@"customData"]];
  }

  return options;
}

+ (id)fromGCKMediaQueueLoadOptions:(GCKMediaQueueLoadOptions *)options {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"startIndex"] = @(options.startIndex);
  json[@"playPosition"] = @(options.playPosition);
  json[@"repeatMode"] = [RCTConvert fromGCKMediaRepeatMode:options.repeatMode];
  json[@"customData"] = options.customData ?: [NSNull null];

  return json;
}

@end
