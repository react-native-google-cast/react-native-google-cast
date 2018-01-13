#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const DEVICE_AVAILABLE = @"GoogleCast:DeviceAvailable";
static NSString *const DEVICE_CONNECTED = @"GoogleCast:DeviceConnected";
static NSString *const DEVICE_DISCONNECTED = @"GoogleCast:DeviceDisconnected";
static NSString *const MEDIA_LOADED = @"GoogleCast:MediaLoaded";
static NSString *const SESSION_ENDED = @"GoogleCast:SessionEnded";

@interface GoogleCast
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener,
                       GCKSessionManagerListener, GCKRemoteMediaClientListener>

@property GCKMediaControlChannel *mediaControlChannel;
@property(nonatomic, strong) GCKApplicationMetadata *applicationMetadata;
//@property(nonatomic, strong) GCKDevice *selectedDevice;
//@property(nonatomic, strong) GCKDeviceScanner* deviceScanner;
@property(nonatomic, strong) GCKSessionManager *sessionManager;
//@property(nonatomic, strong) GCKMediaInformation* mediaInformation;
//@property(nonatomic, strong) NSMutableDictionary *currentDevices;
@end
