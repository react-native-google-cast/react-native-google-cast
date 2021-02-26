#ifndef RCTConvert_GCKApplicationMetadata_h
#define RCTConvert_GCKApplicationMetadata_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKApplicationMetadata)

+ (nonnull id)fromGCKApplicationMetadata:(nullable GCKApplicationMetadata *)metadata;

@end


#endif /* RCTConvert_GCKApplicationMetadata_h */
