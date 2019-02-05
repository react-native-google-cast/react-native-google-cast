#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaMetadataType)

RCT_ENUM_CONVERTER(GCKMediaMetadataType, (@{
                     @"Generic" : @(GCKMediaMetadataTypeGeneric),
                     @"Movie" : @(GCKMediaMetadataTypeMovie),
                     @"MusicTrack" : @(GCKMediaMetadataTypeMusicTrack),
                     @"Photo" : @(GCKMediaMetadataTypePhoto),
                     @"TvShow" : @(GCKMediaMetadataTypeTVShow)
                   }),
                   GCKMediaMetadataTypeUser, integerValue)

+ (id)fromGCKMediaMetadataType:(GCKMediaMetadataType)metadataType {
  switch (metadataType) {
  case GCKMediaMetadataTypeGeneric:
    return @"Generic";
  case GCKMediaMetadataTypeMovie:
    return @"Movie";
  case GCKMediaMetadataTypeMusicTrack:
    return @"MusicTrack";
  case GCKMediaMetadataTypePhoto:
    return @"Photo";
  case GCKMediaMetadataTypeTVShow:
    return @"TvShow";
  default:
    return nil;
  }
}

@end
