#import "RCTConvert+GCKMediaResumeState.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaSeekOptions)

+ (GCKMediaSeekOptions *)GCKMediaSeekOptions:(id)json {
  GCKMediaSeekOptions *options = [[GCKMediaSeekOptions alloc] init];

  if (json[@"customData"]) {
    options.customData = [RCTConvert id:json[@"customData"]];
  }

  if (json[@"infinite"]) {
    options.seekToInfinite = [RCTConvert BOOL:json[@"infinite"]];
  }

  if (json[@"position"]) {
    options.interval = [RCTConvert NSTimeInterval:json[@"position"]];
  }

  if (json[@"resumeState"]) {
    options.resumeState = [RCTConvert GCKMediaResumeState:json[@"resumeState"]];
  }

  return options;
}

@end
