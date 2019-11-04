#import "RCTConvert+GCKMediaInformation.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueItem)

+ (NSArray<GCKMediaQueueItem *> *)GCKMediaQueueItemArray:(id)json {
  NSMutableArray<GCKMediaQueueItem *> *items = [[NSMutableArray alloc] init];
  for (id item in json) {
    [items addObject:[RCTConvert GCKMediaQueueItem:item]];
  }
  return items;
}

+ (GCKMediaQueueItem *)GCKMediaQueueItem:(id)json {
  GCKMediaQueueItemBuilder *builder = [[GCKMediaQueueItemBuilder alloc] init];

  if (json[@"activeTrackIds"]) {
    NSMutableArray<NSNumber *> *tracks = [[NSMutableArray alloc] init];
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
    [RCTConvert GCKMediaInformation:json[@"mediaInfo"]];
  }

  if (json[@"playbackDuration"]) {
    builder.playbackDuration = [RCTConvert NSTimeInterval:json[@"playbackDuration"]];
  }

  if (json[@"preloadTime"]) {
    builder.preloadTime = [RCTConvert NSTimeInterval:json[@"preloadTime"]];
  }

  if (json[@"startTime"]) {
    builder.startTime = [RCTConvert NSTimeInterval:json[@"startTime"]];
  }

  return [builder build];
}

+ (id)fromGCKMediaQueueItem:(GCKMediaQueueItem *)item {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"activeTrackIds"] = item.activeTrackIDs;

  json[@"autoplay"] = @(item.autoplay);

  json[@"customData"] = item.customData ?: [NSNull null];

  if (item.itemID != kGCKMediaQueueInvalidItemID) {
    json[@"itemId"] = @(item.itemID);
  }
  
  json[@"mediaInfo"] =
  [RCTConvert fromGCKMediaInformation:item.mediaInformation];

  if (!isinf(item.playbackDuration)) {
    json[@"playbackDuration"] = @(item.playbackDuration);
  }

  if (!isnan(item.preloadTime)) {
    json[@"preloadTime"] = @(item.preloadTime);
  }

  if (!isnan(item.startTime)) {
    json[@"startTime"] = @(item.startTime);
  }

  return json;
}

@end
