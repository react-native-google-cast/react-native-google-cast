#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaMetadataType)

RCT_ENUM_CONVERTER(GCKMediaMetadataType, (@{
                     @"generic" : @(GCKMediaMetadataTypeGeneric),
                     @"movie" : @(GCKMediaMetadataTypeMovie),
                     @"musicTrack" : @(GCKMediaMetadataTypeMusicTrack),
                     @"photo" : @(GCKMediaMetadataTypePhoto),
                     @"tvShow" : @(GCKMediaMetadataTypeTVShow)
                   }),
                   GCKMediaMetadataTypeUser, integerValue)

+ (id)fromGCKMediaMetadataType:(GCKMediaMetadataType)metadataType {
  switch (metadataType) {
  case GCKMediaMetadataTypeGeneric:
    return @"generic";
  case GCKMediaMetadataTypeMovie:
    return @"movie";
  case GCKMediaMetadataTypeMusicTrack:
    return @"musicTrack";
  case GCKMediaMetadataTypePhoto:
    return @"photo";
  case GCKMediaMetadataTypeTVShow:
    return @"tvShow";
  default:
    return [NSNull null];
  }
}

@end
