#ifndef RCTConvert_GCKMediaQueueData_h
#define RCTConvert_GCKMediaQueueData_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaQueueData)

+ (GCKMediaQueueData *)GCKMediaQueueData:(id)json;
+ (nonnull id)fromGCKMediaQueueData:(nullable GCKMediaQueueData *)data;

@end

#endif /* RCTConvert_GCKMediaQueueData_h */
