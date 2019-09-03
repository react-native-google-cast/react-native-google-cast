#import "RCTConvert+GCKMediaInformation.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueItem)

+ (GCKMediaQueueItem *)GCKMediaQueueItem:(id)json {
  GCKMediaQueueItemBuilder *builder = [[GCKMediaQueueItemBuilder alloc] init];

  if (json[@"activeTrackIds"]) {
    NSMutableArray<NSNumber *> *tracks;
    for (id track in json[@"activeTrackIds"]) {
      [tracks addObject:[RCTConvert NSNumber:track]];
    }
    builder.activeTrackIDs = tracks;
  }

  if (json[@"autoplay"]) {
    builder.autoplay = [RCTConvert BOOL:json[@"autoplay"]];
  }

  if (json[@"customData"]) {
    builder.customData = [RCTConvert id:json[@"customData"]];
  }
  
  if (json[@"mediaInfo"]) {
    builder.mediaInformation =
    [RCTConvert fromGCKMediaInformation:json[@"mediaInfo"]];
  }

  if (json[@"playbackDuration"]) {
    builder.playbackDuration = [RCTConvert double:json[@"playbackDuration"]];
  }

  if (json[@"preloadTime"]) {
    builder.preloadTime = [RCTConvert double:json[@"preloadTime"]];
  }

  if (json[@"startTime"]) {
    builder.startTime = [RCTConvert double:json[@"startTime"]];
  }

  return [builder build];
}

+ (id)fromGCKMediaQueueItem:(GCKMediaQueueItem *)item {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"activeTrackIds"] = item.activeTrackIDs;

  json[@"autoplay"] = @(item.autoplay);

  json[@"customData"] = item.customData;

  json[@"itemId"] = @(item.itemID);
  
  json[@"mediaInfo"] =
  [RCTConvert fromGCKMediaInformation:item.mediaInformation];

  json[@"playbackDuration"] = @(item.playbackDuration);

  json[@"preloadTime"] = @(item.preloadTime);

  json[@"startTime"] = @(item.startTime);

  return json;
}

@end
