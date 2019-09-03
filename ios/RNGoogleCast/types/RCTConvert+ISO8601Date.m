#import <React/RCTConvert.h>

@implementation RCTConvert (ISO8601Date)

+ (NSDate *)ISO8601Date:(id)json {
  if ([json isKindOfClass:[NSNumber class]]) {
    return [NSDate dateWithTimeIntervalSince1970:[self NSTimeInterval:json]];
  } else if ([json isKindOfClass:[NSString class]]) {
    static NSArray<NSDateFormatter *> *formatters;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      NSMutableArray<NSDateFormatter *> *formattersTemp = [NSMutableArray new];
      NSArray<NSString *> *formats =
          [NSArray arrayWithObjects:@"yyyy-MM-dd",
                                    @"yyyy-MM-dd'T'HH:mm:ss",
                                    @"yyyy-MM-dd'T'HH:mm:ssZZZZZ",
                                    nil];
      for (NSString *format in formats) {
        NSDateFormatter *formatter = [NSDateFormatter new];
        formatter.dateFormat = format;
        formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
        formatter.timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
        [formattersTemp addObject:formatter];
      }
      formatters = [formattersTemp copy];
    });

    for (NSDateFormatter *formatter in formatters) {
      NSDate *date = [formatter dateFromString:json];
      if (date)
        return date;
    }

    RCTLogError(@"JSON String '%@' could not be interpreted as a date. "
                 "Expected one of the following formats:\n"
                 "YYYY-MM-DD\n"
                 "YYYY-MM-DD'T'HH:mm:ss\n"
                 "YYYY-MM-DD'T'HH:mm:ssZ",
                json);
  } else if (json) {
    RCTLogConvertError(json, @"a date");
  }
  return nil;
}

@end
