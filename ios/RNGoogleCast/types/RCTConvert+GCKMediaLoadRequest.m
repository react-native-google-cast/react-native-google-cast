#import "RCTConvert+GCKMediaInformation.m"
#import "RCTConvert+GCKMediaQueueData.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaLoadRequest)

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

  if (json[@"mediaInfo"]) {
    builder.mediaInformation = [RCTConvert GCKMediaInformation:json[@"mediaInfo"]];
  }

  if (json[@"playbackRate"]) {
    builder.playbackRate = [RCTConvert float:json[@"playbackRate"]];
  }

  if (json[@"queueData"]) {
    builder.queueData = [RCTConvert GCKMediaQueueData:json[@"queueData"]];
  }

  if (json[@"startTime"]) {
    builder.startTime = [RCTConvert NSTimeInterval:json[@"startTime"]];
  }

  return [builder build];
}

@end
