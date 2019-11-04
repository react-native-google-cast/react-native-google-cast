#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaLoadOptions)

+ (GCKMediaLoadOptions *)GCKMediaLoadOptions:(id)json {
  GCKMediaLoadOptions *options = [[GCKMediaLoadOptions alloc] init];

  if (json[@"activeTrackIds"]) {
    options.activeTrackIDs = json[@"activeTrackIds"];
  }

  if (json[@"autoplay"]) {
    options.autoplay = [RCTConvert BOOL:json[@"autoplay"]];
  }

  if (json[@"credentials"]) {
    options.credentials = [RCTConvert NSString:json[@"credentials"]];
  }

  if (json[@"credentialsType"]) {
    options.credentialsType = [RCTConvert NSString:json[@"credentialsType"]];
  }

  if (json[@"customData"]) {
    options.customData = [RCTConvert id:json[@"customData"]];
  }
  
  if (json[@"playbackRate"]) {
    options.playbackRate = [RCTConvert float:json[@"playbackRate"]];
  }

  if (json[@"playPosition"]) {
    options.playPosition = [RCTConvert NSTimeInterval:json[@"playPosition"]];
  }

  return options;
}

+ (id)fromGCKMediaLoadOptions:(GCKMediaLoadOptions *)options {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"autoplay"] = @(options.autoplay);

  json[@"credentials"] = options.credentials ?: [NSNull null];

  json[@"credentialsType"] = options.credentialsType ?: [NSNull null];

  json[@"customData"] = options.customData ?: [NSNull null];
  
  json[@"playbackRate"] = @(options.playbackRate);

  json[@"playPosition"] = @(options.playPosition);

  return json;
}

@end
