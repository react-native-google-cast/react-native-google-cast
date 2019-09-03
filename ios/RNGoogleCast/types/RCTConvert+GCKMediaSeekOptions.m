#import "RCTConvert+GCKMediaResumeState.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaSeekOptions)

+ (GCKMediaSeekOptions *)GCKMediaSeekOptions:(id)json {
  GCKMediaSeekOptions *options = [[GCKMediaSeekOptions alloc] init];

  if (json[@"interval"]) {
    options.interval = [RCTConvert double:json[@"interval"]];
  }
  if (json[@"relative"]) {
    options.relative = [RCTConvert BOOL:json[@"relative"]];
  }
  if (json[@"resumeState"]) {
    options.resumeState = [RCTConvert GCKMediaResumeState:json[@"resumeState"]];
  }
  if (json[@"customData"]) {
    options.customData = [RCTConvert id:json[@"customData"]];
  }

  return options;
}

@end
