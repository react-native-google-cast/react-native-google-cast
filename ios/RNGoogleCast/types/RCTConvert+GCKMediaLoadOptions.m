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
    options.playPosition = [RCTConvert double:json[@"playPosition"]];
  }

  return options;
}

+ (id)fromGCKMediaLoadOptions:(GCKMediaLoadOptions *)options {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"autoplay"] = @(options.autoplay);

  json[@"credentials"] = options.credentials;

  json[@"credentialsType"] = options.credentialsType;

  json[@"customData"] = options.customData;
  
  json[@"playbackRate"] = @(options.playbackRate);

  json[@"playPosition"] = @(options.playPosition);

  return json;
}

@end
