#ifndef RCTConvert_ISO8601Date_h
#define RCTConvert_ISO8601Date_h

#import <React/RCTConvert.h>

@interface RCTConvert (ISO8601Date)

+ (NSDate *)ISO8601Date:(id)json;

@end

#endif /* RCTConvert_ISO8601Date_h */
