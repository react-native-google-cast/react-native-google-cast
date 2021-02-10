#ifndef RCTConvert_GCKMediaQueueContainerMetadata_h
#define RCTConvert_GCKMediaQueueContainerMetadata_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaQueueContainerMetadata)

+ (GCKMediaQueueContainerMetadata *)GCKMediaQueueContainerMetadata:(id)json;
+ (nonnull id)fromGCKMediaQueueContainerMetadata:(nullable GCKMediaQueueContainerMetadata *)metadata;

@end

#endif /* RCTConvert_GCKMediaQueueContainerMetadata_h */
