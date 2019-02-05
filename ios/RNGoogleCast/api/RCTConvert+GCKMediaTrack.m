#import "RCTConvert+GCKMediaTextTrackSubtype.m"
#import "RCTConvert+GCKMediaTrackType.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaTrack)

+ (GCKMediaTrack *)GCKMediaTrack:(id)json {
  return [[GCKMediaTrack alloc]
      initWithIdentifier:[RCTConvert NSInteger:json[@"id"]]
       contentIdentifier:json[@"contentId"]
             contentType:json[@"contentType"]
                    type:[RCTConvert GCKMediaTrackType:json[@"type"]]
             textSubtype:[RCTConvert GCKMediaTextTrackSubtype:json[@"subtype"]]
                    name:json[@"name"]
            languageCode:json[@"languageCode"]
              customData:json[@"customData"]];
}

+ (id)fromGCKMediaTrack:(GCKMediaTrack *)track {
  return @{
    @"id" : @(track.identifier),
    @"contentId" : track.contentIdentifier,
    @"contentType" : track.contentType,
    @"type" : [RCTConvert fromGCKMediaTrackType:track.type],
    @"subtype" : [RCTConvert fromGCKMediaTextTrackSubtype:track.textSubtype],
    @"name" : track.name,
    @"languageCode" : track.languageCode,
    @"customData" : track.customData,
  };
}

@end
