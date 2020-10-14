#import "RCTConvert+GCKMediaQueueContainerMetadata.m"
#import "RCTConvert+GCKMediaRepeatMode.m"
#import "RCTConvert+GCKMediaQueueItem.m"
#import "RCTConvert+GCKMediaQueueType.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

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
    builder.startTime = [RCTConvert NSTimeInterval:json[@"startTime"]];
  }

  if (json[@"type"]) {
    builder.queueType = [RCTConvert GCKMediaQueueType:json[@"type"]];
  }

  return [builder build];
}

+ (id)fromGCKMediaQueueData:(GCKMediaQueueData *)data {
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

  json[@"startIndex"] = @(data.startIndex);

  json[@"startTime"] = @(data.startTime);

  json[@"type"] = [RCTConvert fromGCKMediaQueueType:data.queueType];

  return json;
}

@end
