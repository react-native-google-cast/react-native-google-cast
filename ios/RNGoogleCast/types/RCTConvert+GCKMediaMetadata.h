#ifndef RCTConvert_GCKMediaMetadata_h
#define RCTConvert_GCKMediaMetadata_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaMetadata)

+ (nonnull GCKMediaMetadata *)GCKMediaMetadata:(nonnull id)json;
+ (nonnull id)fromGCKMediaMetadata:(nullable GCKMediaMetadata *)metadata;

@end

#endif /* RCTConvert_GCKMediaMetadata_h */
