#ifndef RCTConvert_GCKMediaSeekOptions_h
#define RCTConvert_GCKMediaSeekOptions_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaSeekOptions)

+ (GCKMediaSeekOptions *)GCKMediaSeekOptions:(id)json;

@end

#endif /* RCTConvert_GCKMediaSeekOptions_h */
