#import "RCTConvert+GCKDevice.h"

#import "RCTConvert+GCKImage.h"

@implementation RCTConvert (GCKDevice)

+ (nonnull id)fromGCKDevice:(nullable GCKDevice *)device {
  if (device == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  NSMutableArray<NSString *> *capabilities = [NSMutableArray array];
  if ([device hasCapabilities:GCKDeviceCapabilityVideoOut]) {
    [capabilities addObject:@"VideoOut"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityAudioOut]) {
    [capabilities addObject:@"AudioOut"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityVideoIn]) {
    [capabilities addObject:@"VideoIn"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityAudioIn]) {
    [capabilities addObject:@"AudioIn"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityDynamicGroup]) {
    [capabilities addObject:@"DynamicGroup"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityMultizoneGroup]) {
    [capabilities addObject:@"MultizoneGroup"];
  }
  if ([device hasCapabilities:GCKDeviceCapabilityMultiChannelGroup]) {
    [capabilities addObject:@"MultiChannelGroup"];
  }
  json[@"capabilities"] = capabilities;

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
