#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKImage)

+ (GCKImage *)GCKImage:(id)json {
  return [[GCKImage alloc] initWithURL:[RCTConvert NSURL:json[@"url"]]
                                 width:[RCTConvert NSInteger:json[@"width"]]
                                height:[RCTConvert NSInteger:json[@"height"]]];
}

+ (id)fromGCKImage:(GCKImage *)image {
  return @{
    @"height" : @(image.height),
    @"url" : [image.URL absoluteString],
    @"width" : @(image.width),
  };
}

@end
