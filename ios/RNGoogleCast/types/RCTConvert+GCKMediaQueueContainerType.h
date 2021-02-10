#ifndef RCTConvert_GCKMediaQueueContainerType_h
#define RCTConvert_GCKMediaQueueContainerType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaQueueContainerType)

+ (GCKMediaQueueContainerType)GCKMediaQueueContainerType:(nullable id)json;
+ (nonnull id)fromGCKMediaQueueContainerType:(GCKMediaQueueContainerType)type;

@end

#endif /* RCTConvert_GCKMediaQueueContainerType_h */
