#import "RCTConvert+GCKMediaQueueData.h"

#import "RCTConvert+GCKMediaQueueContainerMetadata.h"
#import "RCTConvert+GCKMediaRepeatMode.h"
#import "RCTConvert+GCKMediaQueueItem.h"
#import "RCTConvert+GCKMediaQueueType.h"

@implementation RCTConvert (GCKMediaQueueData)

+ (GCKMediaQueueData *)GCKMediaQueueData:(id)json {
  GCKMediaQueueDataBuilder *builder = [[GCKMediaQueueDataBuilder alloc] initWithQueueType:GCKMediaQueueTypeGeneric];

  if (json[@"containerMetadata"]) {
    builder.containerMetadata = [RCTConvert GCKMediaQueueContainerMetadata:json[@"containerMetadata"]];
  }

  if (json[@"entity"]) {
    builder.entity = [RCTConvert NSString:json[@"entity"]];
  }

  if (json[@"id"]) {
    builder.queueID = [RCTConvert NSString:json[@"id"]];
  }

  if (json[@"items"]) {
    NSMutableArray<GCKMediaQueueItem *> *items = [[NSMutableArray alloc] init];
    for (id item in json[@"items"]) {
      [items addObject:[RCTConvert GCKMediaQueueItem:item]];
    }
    builder.items = items;
  }

  if (json[@"name"]) {
    builder.name = [RCTConvert NSString:json[@"name"]];
  }

  if (json[@"repeatMode"]) {
    builder.repeatMode = [RCTConvert GCKMediaRepeatMode:json[@"repeatMode"]];
  }

  if (json[@"startIndex"]) {
    builder.startIndex = [RCTConvert NSUInteger:json[@"startIndex"]];
  }

  if (json[@"startTime"]) {
    builder.startTime = [RCTConvert double:json[@"startTime"]];
  }

  if (json[@"type"]) {
    builder.queueType = [RCTConvert GCKMediaQueueType:json[@"type"]];
  }

  return [builder build];
}

+ (nonnull id)fromGCKMediaQueueData:(nullable GCKMediaQueueData *)data {
  if (data == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"containerMetadata"] = [RCTConvert fromGCKMediaQueueContainerMetadata:data.containerMetadata];

  json[@"entity"] = data.entity;

  json[@"id"] = data.queueID;

  NSMutableArray<id> *items = [[NSMutableArray alloc] init];
  for (GCKMediaQueueItem *item in data.items) {
    [items addObject:[RCTConvert fromGCKMediaQueueItem:item]];
  };
  json[@"items"] = items;

  json[@"name"] = data.name;

  json[@"repeatMode"] = [RCTConvert fromGCKMediaRepeatMode:data.repeatMode];

  json[@"type"] = [RCTConvert fromGCKMediaQueueType:data.queueType];

  return json;
}

@end
