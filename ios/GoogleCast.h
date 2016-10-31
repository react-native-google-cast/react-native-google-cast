
#import "RCTBridgeModule.h"

@interface GoogleCast : NSObject <RCTBridgeModule, GCKDeviceScannerListener, GCKDeviceManagerDelegate,GCKMediaControlChannelDelegate>

@property GCKMediaControlChannel *mediaControlChannel;
@property(nonatomic, strong) GCKApplicationMetadata *applicationMetadata;
@property(nonatomic, strong) GCKDevice *selectedDevice;
@property(nonatomic, strong) GCKDeviceScanner* deviceScanner;
@property(nonatomic, strong) GCKDeviceManager* deviceManager;
@property(nonatomic, strong) GCKMediaInformation* mediaInformation;
@property(nonatomic, strong) NSMutableDictionary *currentDevices;

@end