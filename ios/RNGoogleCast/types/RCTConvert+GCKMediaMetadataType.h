#ifndef RCTConvert_GCKMediaMetadataType_h
#define RCTConvert_GCKMediaMetadataType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaMetadataType)

+ (GCKMediaMetadataType)GCKMediaMetadataType:(id)json;
+ (nonnull id)fromGCKMediaMetadataType:(GCKMediaMetadataType)metadataType;

@end

#endif /* RCTConvert_GCKMediaMetadataType_h */
