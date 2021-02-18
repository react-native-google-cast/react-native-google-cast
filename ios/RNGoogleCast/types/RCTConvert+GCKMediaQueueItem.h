#ifndef RCTConvert_GCKMediaQueueItem_h
#define RCTConvert_GCKMediaQueueItem_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaQueueItem)

+ (NSArray<GCKMediaQueueItem *> *)GCKMediaQueueItemArray:(id)json;
+ (GCKMediaQueueItem *)GCKMediaQueueItem:(id)json;
+ (nonnull id)fromGCKMediaQueueItem:(nullable GCKMediaQueueItem *)item;

@end

#endif /* RCTConvert_GCKMediaQueueItem_h */
