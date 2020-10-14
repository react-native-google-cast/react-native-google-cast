#import "RCTConvert+GCKMediaMetadata.m"
#import "RCTConvert+GCKMediaQueueContainerType.m"
#import "RCTConvert+GCKImage.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueContainerMetadata)

+ (GCKMediaQueueContainerMetadata *)GCKMediaQueueContainerMetadata:(id)json {
  GCKMediaQueueContainerMetadataBuilder *builder = [[GCKMediaQueueContainerMetadataBuilder alloc] initWithContainerType:GCKMediaQueueContainerTypeGeneric];
  
  if (json[@"containerDuration"]) {
    builder.containerDuration = [RCTConvert NSTimeInterval:json[@"containerDuration"]];
  }

  if (json[@"containerImages"]) {
    NSMutableArray<GCKImage *> *images = [[NSMutableArray alloc] init];
    for (id image in json[@"containerImages"]) {
      [images addObject:[RCTConvert GCKImage:image]];
    }
    builder.containerImages = images;
  }
  
  if (json[@"containerType"]) {
    builder.containerType = [RCTConvert GCKMediaQueueContainerType:json[@"containerType"]];
  }
  
  if (json[@"sections"]) {
    NSMutableArray<GCKMediaMetadata *> *sections = [[NSMutableArray alloc] init];
    for (id section in json[@"sections"]) {
      [sections addObject:[RCTConvert GCKMediaMetadata:section]];
    }
    builder.sections = sections;
  }
  
  if (json[@"title"]) {
    builder.title = [RCTConvert NSString:json[@"title"]];
  }
  
  return [builder build];
}

+ (id)fromGCKMediaQueueContainerMetadata:(GCKMediaQueueContainerMetadata *)metadata {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"containerDuration"] = @(metadata.containerDuration);

  NSMutableArray<id> *images = [[NSMutableArray alloc] init];
  for (GCKImage *image in metadata.containerImages) {
    [images addObject:[RCTConvert fromGCKImage:image]];
  };
  json[@"containerImages"] = images;
  
  json[@"containerType"] = [RCTConvert fromGCKMediaQueueContainerType:metadata.containerType];

  NSMutableArray<id> *sections = [[NSMutableArray alloc] init];
  for (GCKMediaMetadata *section in metadata.sections) {
    [sections addObject:[RCTConvert fromGCKMediaMetadata:section]];
  };
  json[@"sections"] = sections;
  
  json[@"title"] = metadata.title;
  
  return json;
}

@end
