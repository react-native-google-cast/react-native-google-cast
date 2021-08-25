#import "RCTConvert+GCKMediaInformation.h"

#import "RCTConvert+GCKAdBreakClipInfo.h"
#import "RCTConvert+GCKAdBreakInfo.h"
#import "RCTConvert+GCKMediaMetadata.h"
#import "RCTConvert+GCKMediaStreamType.h"
#import "RCTConvert+GCKMediaTrack.h"
#import "RCTConvert+GCKMediaTextTrackStyle.h"

#if GCK_VERSION_IS_AT_LEAST(4, 6, 0)
#import "RCTConvert+GCKHLSSegmentFormat.h"
#import "RCTConvert+GCKHLSVideoSegmentFormat.h"
#endif

@implementation RCTConvert (GCKMediaInformation)

+ (nonnull GCKMediaInformation *)GCKMediaInformation:(nonnull id)json {
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

  #if GCK_VERSION_IS_AT_LEAST(4, 3, 4)
    if (json[@"contentId"]) {
      builder.contentID = [RCTConvert NSString:json[@"contentId"]];
    }
  #endif

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

#if GCK_VERSION_IS_AT_LEAST(4, 6, 0)
  if (json[@"hlsSegmentFormat"]) {
    builder.hlsSegmentFormat = [RCTConvert GCKHLSSegmentFormat:json[@"hlsSegmentFormat"]];
  }

  if (json[@"hlsVideoSegmentFormat"]) {
    builder.hlsVideoSegmentFormat = [RCTConvert GCKHLSVideoSegmentFormat:json[@"hlsVideoSegmentFormat"]];
  }
#endif

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
    builder.streamDuration = [RCTConvert double:json[@"streamDuration"]];
  }

  if (json[@"streamType"]) {
    builder.streamType = [RCTConvert GCKMediaStreamType:json[@"streamType"]];
  }

  //  if (json[@"textTrackStyle"]) {
  //      builder.textTrackStyle = json[@"textTrackStyle"];
  //  }

  return [builder build];
}

+ (nonnull id)fromGCKMediaInformation:(nullable GCKMediaInformation *)info {
  if (info == nil) return [NSNull null];

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

  json[@"contentType"] = info.contentType ?: [NSNull null];

  json[@"contentUrl"] = info.contentURL ?: [NSNull null];

  json[@"customData"] = info.customData ?: [NSNull null];

  json[@"entity"] = info.entity ?: [NSNull null];
  
#if GCK_VERSION_IS_AT_LEAST(4, 6, 0)
  json[@"hlsSegmentFormat"] = [RCTConvert fromGCKHLSSegmentFormat:info.hlsSegmentFormat];

  json[@"hlsVideoSegmentFormat"] = [RCTConvert fromGCKHLSVideoSegmentFormat:info.hlsVideoSegmentFormat];
#endif

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

  json[@"textTrackStyle"] = [RCTConvert fromGCKMediaTextTrackStyle:info.textTrackStyle];
  
  return json;
}

@end
