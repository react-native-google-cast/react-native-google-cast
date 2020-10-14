#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueContainerType)

RCT_ENUM_CONVERTER(GCKMediaQueueContainerType, (@{
                     @"audioBook" : @(GCKMediaQueueContainerTypeAudioBook),
                   }),
                   GCKMediaQueueContainerTypeGeneric, integerValue)

+ (id)fromGCKMediaQueueContainerType:(GCKMediaQueueContainerType)type {
  switch (type) {
  case GCKMediaQueueContainerTypeAudioBook:
    return @"audioBook";
  default:
    return [NSNull null];
  }
}

@end
