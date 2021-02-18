#ifndef RCTConvert_GCKMediaInformation_h
#define RCTConvert_GCKMediaInformation_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaInformation)

+ (nonnull GCKMediaInformation *)GCKMediaInformation:(nonnull id)json;
+ (nonnull id)fromGCKMediaInformation:(nullable GCKMediaInformation *)info;

@end

#endif /* RCTConvert_GCKMediaInformation_h */
