#import "RCTConvert+GCKImage.h"

@implementation RCTConvert (GCKImage)

+ (GCKImage *)GCKImage:(id)json {
  return [[GCKImage alloc] initWithURL:[RCTConvert NSURL:json[@"url"]]
                                 width:[RCTConvert NSInteger:json[@"width"]]
                                height:[RCTConvert NSInteger:json[@"height"]]];
}

+ (nonnull id)fromGCKImage:(nullable GCKImage *)image {
  if (image == nil || image.URL == nil) return [NSNull null];

  NSString *url = [image.URL absoluteString];
  if (url == nil) return [NSNull null];

  return @{
    @"height" : @(image.height),
    @"url" : url,
    @"width" : @(image.width),
  };
}

@end
