#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaLoadOptions)

+ (GCKMediaLoadRequestData *)GCKMediaLoadRequestData:(id)json {
  GCKMediaLoadRequestDataBuilder *builder = [[GCKMediaLoadRequestDataBuilder alloc] init];

  if (json[@"activeTrackIds"]) {
    builder.activeTrackIDs = json[@"activeTrackIds"];
  }

  if (json[@"autoplay"]) {
    builder.autoplay = json[@"autoplay"] == nil ? nil : [RCTConvert BOOL:json[@"autoplay"]] ? @(YES) : @(NO);
  }

  if (json[@"credentials"]) {
    builder.credentials = [RCTConvert NSString:json[@"credentials"]];
  }

  if (json[@"credentialsType"]) {
    builder.credentialsType = [RCTConvert NSString:json[@"credentialsType"]];
  }

  if (json[@"customData"]) {
    builder.customData = [RCTConvert id:json[@"customData"]];
  }

  if (json[@"playbackRate"]) {
    builder.playbackRate = [RCTConvert float:json[@"playbackRate"]];
  }

  if (json[@"startTime"]) {
    builder.startTime = [RCTConvert NSTimeInterval:json[@"startTime"]];
  }

  return [builder build];
}

+ (id)fromGCKMediaLoadRequestData:(GCKMediaLoadRequestData *)data {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"autoplay"] = data.autoplay == nil ? [NSNull null] : data.autoplay ? @(YES) : @(NO);

  json[@"credentials"] = data.credentials ?: [NSNull null];

  json[@"credentialsType"] = data.credentialsType ?: [NSNull null];

  json[@"customData"] = data.customData ?: [NSNull null];

  json[@"playbackRate"] = @(data.playbackRate);

  json[@"startTime"] = @(data.startTime);

  return json;
}

@end
