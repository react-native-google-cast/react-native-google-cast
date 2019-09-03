#import "RCTConvert+GCKImage.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKApplicationMetadata)

+ (id)fromGCKApplicationMetadata:(GCKApplicationMetadata *)metadata {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"applicationId"] = metadata.applicationID;

  NSMutableArray<id> *images;
  for (GCKImage *image in metadata.images) {
    [images addObject:[RCTConvert fromGCKImage:image]];
  };
  json[@"images"] = images;

  json[@"name"] = metadata.applicationName;

  NSMutableArray<id> *namespaces;
  for (NSString *namespace in metadata.namespaces) {
    [namespaces addObject:namespace];
  };
  json[@"namespaces"] = namespaces;

  return json;
}

@end
