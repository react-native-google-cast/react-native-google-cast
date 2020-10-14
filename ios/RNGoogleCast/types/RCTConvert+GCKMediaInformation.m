#import "RCTConvert+GCKAdBreakClipInfo.m"
#import "RCTConvert+GCKAdBreakInfo.m"
#import "RCTConvert+GCKMediaMetadata.m"
#import "RCTConvert+GCKMediaStreamType.m"
#import "RCTConvert+GCKMediaTrack.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaInformation)

+ (GCKMediaInformation *)GCKMediaInformation:(id)json {
  GCKMediaInformationBuilder *builder;
  
  #if GCK_VERSION_IS_AT_LEAST(4, 3, 4)
    builder = [[GCKMediaInformationBuilder alloc] initWithContentURL:[NSURL URLWithString:json[@"contentUrl"]]];
  #else
    builder = [[GCKMediaInformationBuilder alloc] initWithContentID:json[@"contentId"] || json[@"contentUrl"]];
  #endif

//  if (json[@"adBreakClips"]) {
//    NSMutableArray<GCKAdBreakClipInfo *> *adBreakClips;
//    for (id clip in json[@"adBreakClips"]) {
//      [adBreakClips addObject:[RCTConvert GCKAdBreakClipInfo:clip]];
//    }
//    builder.adBreakClips = adBreakClips;
//  }
  
  if (json[@"adBreaks"]) {
    NSMutableArray<GCKAdBreakInfo *> *adBreaks = [[NSMutableArray alloc] init];
    for (id adBreak in json[@"adBreaks"]) {
      [adBreaks addObject:[RCTConvert GCKAdBreakInfo:adBreak]];
    }
    builder.adBreaks = adBreaks;
  }
  
  if (json[@"contentType"]) {
    builder.contentType = [RCTConvert NSString:json[@"contentType"]];
  }
  
  if (json[@"contentUrl"]) {
    builder.contentURL = [NSURL URLWithString:[RCTConvert NSString:json[@"contentUrl"]]];
  }

  if (json[@"customData"]) {
    builder.customData = [RCTConvert id:json[@"customData"]];
  }
  
  if (json[@"entity"]) {
    builder.entity = [RCTConvert NSString:json[@"entity"]];
  }
  
  if (json[@"mediaTracks"]) {
    NSMutableArray<GCKMediaTrack *> *mediaTracks = [[NSMutableArray alloc] init];
    for (id track in json[@"mediaTracks"]) {
      [mediaTracks addObject:[RCTConvert GCKMediaTrack:track]];
    }
    builder.mediaTracks = mediaTracks;
  }
  
  if (json[@"metadata"]) {
    builder.metadata = [RCTConvert GCKMediaMetadata:json[@"metadata"]];
  }
  
  if (json[@"streamDuration"]) {
    builder.streamDuration = [RCTConvert NSTimeInterval:json[@"streamDuration"]] * 1000;
  }
  
  if (json[@"streamType"]) {
    builder.streamType = [RCTConvert GCKMediaStreamType:json[@"streamType"]];
  }
  
  //  if (json[@"textTrackStyle"]) {
  //      builder.textTrackStyle = json[@"textTrackStyle"];
  //  }

  return [builder build];
}

+ (id)fromGCKMediaInformation:(GCKMediaInformation *)info {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  NSMutableArray<id> *adBreakClips = [[NSMutableArray alloc] init];
  for (GCKAdBreakClipInfo *clip in info.adBreakClips) {
    [adBreakClips addObject:[RCTConvert fromGCKAdBreakClipInfo:clip]];
  };
  json[@"adBreakClips"] = adBreakClips;
  
  NSMutableArray<id> *adBreaks = [[NSMutableArray alloc] init];
  for (GCKAdBreakInfo *adBreak in info.adBreaks) {
    [adBreaks addObject:[RCTConvert fromGCKAdBreakInfo:adBreak]];
  };
  json[@"adBreaks"] = adBreaks;
  
  json[@"contentId"] = info.contentID ?: [NSNull null];

  json[@"contentUrl"] = info.contentURL ?: [NSNull null];
  
  json[@"customData"] = info.customData ?: [NSNull null];

  json[@"contentType"] = info.contentType ?: [NSNull null];

  json[@"entity"] = info.entity ?: [NSNull null];

  NSMutableArray<id> *mediaTracks = [[NSMutableArray alloc] init];
  for (GCKMediaTrack *track in info.mediaTracks) {
    [mediaTracks addObject:[RCTConvert fromGCKMediaTrack:track]];
  };
  json[@"mediaTracks"] = mediaTracks;
  
  json[@"metadata"] = [RCTConvert fromGCKMediaMetadata:info.metadata];

  if (!isinf(info.streamDuration)) {
    json[@"streamDuration"] = @(info.streamDuration);
  }

  json[@"streamType"] = [RCTConvert fromGCKMediaStreamType:info.streamType];
  
  return json;
}

@end
