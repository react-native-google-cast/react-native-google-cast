#ifndef RCTConvert_GCKMediaQueueType_h
#define RCTConvert_GCKMediaQueueType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaQueueType)

+ (GCKMediaQueueType)GCKMediaQueueType:(id)json;
+ (nonnull id)fromGCKMediaQueueType:(GCKMediaQueueType)type;

@end


#endif /* RCTConvert_GCKMediaQueueType_h */
