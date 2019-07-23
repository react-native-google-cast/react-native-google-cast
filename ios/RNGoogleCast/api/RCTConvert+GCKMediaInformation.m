#import "RCTConvert+GCKAdBreakClipInfo.m"
#import "RCTConvert+GCKAdBreakInfo.m"
#import "RCTConvert+GCKMediaMetadata.m"
#import "RCTConvert+GCKMediaStreamType.m"
#import "RCTConvert+GCKMediaTrack.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaInformation)

+ (GCKMediaInformation *)GCKMediaInformation:(id)json {
  GCKMediaInformationBuilder *builder =
      [[GCKMediaInformationBuilder alloc] initWithContentID:json[@"contentId"]];

//  if (json[@"adBreakClips"]) {
//    NSMutableArray<GCKAdBreakClipInfo *> *adBreakClips;
//    for (id clip in json[@"adBreakClips"]) {
//      [adBreakClips addObject:[RCTConvert GCKAdBreakClipInfo:clip]];
//    }
//    builder.adBreakClips = adBreakClips;
//  }
  
  if (json[@"adBreaks"]) {
    NSMutableArray<GCKAdBreakInfo *> *adBreaks;
    for (id adBreak in json[@"adBreaks"]) {
      [adBreaks addObject:[RCTConvert GCKAdBreakInfo:adBreak]];
    }
    builder.adBreaks = adBreaks;
  }
  
  if (json[@"contentType"]) {
    builder.contentType = [RCTConvert NSString:json[@"contentType"]];
  }
  
  if (json[@"customData"]) {
    builder.customData = json[@"customData"];
  }
  
  if (json[@"entity"]) {
    builder.entity = [RCTConvert NSString:json[@"entity"]];
  }
  
  if (json[@"mediaTracks"]) {
    NSMutableArray<GCKMediaTrack *> *mediaTracks;
    for (id track in json[@"mediaTracks"]) {
      [mediaTracks addObject:[RCTConvert GCKMediaTrack:track]];
    }
    builder.mediaTracks = mediaTracks;
  }
  
  if (json[@"metadata"]) {
    builder.metadata = [RCTConvert GCKMediaMetadata:json[@"metadata"]];
  }
  
  if (json[@"streamDuration"]) {
    builder.streamDuration = [RCTConvert double:json[@"streamDuration"]] * 1000;
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

  NSMutableArray<id> *adBreakClips;
  for (GCKAdBreakClipInfo *clip in info.adBreakClips) {
    [adBreakClips addObject:[RCTConvert fromGCKAdBreakClipInfo:clip]];
  };
  json[@"adBreakClips"] = adBreakClips;
  
  NSMutableArray<id> *adBreaks;
  for (GCKAdBreakInfo *adBreak in info.adBreaks) {
    [adBreaks addObject:[RCTConvert fromGCKAdBreakInfo:adBreak]];
  };
  json[@"adBreaks"] = adBreaks;
  
  json[@"contentId"] = info.contentID;

  // TODO in 4.3.4 json[@"contentURL"] = info.contentURL
  
  json[@"customData"] = info.customData;

  json[@"contentType"] = info.contentType;

  json[@"entity"] = info.entity;

  NSMutableArray<id> *mediaTracks;
  for (GCKMediaTrack *track in info.mediaTracks) {
    [mediaTracks addObject:[RCTConvert fromGCKMediaTrack:track]];
  };
  json[@"mediaTracks"] = mediaTracks;
  
  json[@"metadata"] = [RCTConvert fromGCKMediaMetadata:info.metadata];

  json[@"streamDuration"] = @(info.streamDuration);

  json[@"streamType"] = [RCTConvert fromGCKMediaStreamType:info.streamType];
  
  return json;
}

@end
