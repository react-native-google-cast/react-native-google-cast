#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>
#import "RCTConvert+GCKImage.m"

@implementation RCTConvert (GCKDevice)

+ (id)fromGCKDevice:(GCKDevice *)device {
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
