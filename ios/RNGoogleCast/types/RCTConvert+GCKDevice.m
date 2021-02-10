#import "RCTConvert+GCKDevice.h"

#import "RCTConvert+GCKImage.h"

@implementation RCTConvert (GCKDevice)

+ (nonnull id)fromGCKDevice:(nullable GCKDevice *)device {
  if (device == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"deviceId"] = device.deviceID;

  json[@"deviceVersion"] = device.deviceVersion;

  json[@"friendlyName"] = device.friendlyName;

  NSMutableArray<id> *icons;
  for (GCKImage *icon in device.icons) {
    [icons addObject:[RCTConvert fromGCKImage:icon]];
  };
  json[@"icons"] = icons;

  json[@"ipAddress"] = device.networkAddress.ipAddress;

  json[@"isOnLocalNetwork"] = @(device.isOnLocalNetwork);

  json[@"modelName"] = device.modelName;

  return json;
}

@end
