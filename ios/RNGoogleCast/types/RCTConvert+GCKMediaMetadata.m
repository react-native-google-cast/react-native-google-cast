#import "RCTConvert+GCKMediaMetadataType.m"
#import "RCTConvert+GCKImage.m"
#import "RCTConvert+ISO8601Date.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaMetadata)

+ (GCKMediaMetadata *)GCKMediaMetadata:(id)json {
  GCKMediaMetadata *metadata;

  if (json[@"type"]) {
    metadata = [[GCKMediaMetadata alloc]
        initWithMetadataType:[RCTConvert
                                 GCKMediaMetadataType:json[@"type"]]];
  } else {
    metadata = [[GCKMediaMetadata alloc] init];
  }

  if (json[@"images"]) {
    for (id image in json[@"images"]) {
      [metadata addImage:[RCTConvert GCKImage:image]];
    }
  }

  if (json[@"creationDate"]) {
    [metadata setDate:[RCTConvert ISO8601Date:json[@"creationDate"]]
               forKey:kGCKMetadataKeyCreationDate];
  }
  if (json[@"releaseDate"]) {
    [metadata setDate:[RCTConvert ISO8601Date:json[@"releaseDate"]]
               forKey:kGCKMetadataKeyReleaseDate];
  }
  if (json[@"broadcastDate"]) {
    [metadata setDate:[RCTConvert ISO8601Date:json[@"broadcastDate"]]
               forKey:kGCKMetadataKeyBroadcastDate];
  }
  if (json[@"title"]) {
    [metadata setString:[RCTConvert NSString:json[@"title"]]
                 forKey:kGCKMetadataKeyTitle];
  }
  if (json[@"subtitle"]) {
    [metadata setString:[RCTConvert NSString:json[@"subtitle"]]
                 forKey:kGCKMetadataKeySubtitle];
  }
  if (json[@"artist"]) {
    [metadata setString:[RCTConvert NSString:json[@"artist"]]
                 forKey:kGCKMetadataKeyArtist];
  }
  if (json[@"albumArtist"]) {
    [metadata setString:[RCTConvert NSString:json[@"albumArtist"]]
                 forKey:kGCKMetadataKeyAlbumArtist];
  }
  if (json[@"albumTitle"]) {
    [metadata setString:[RCTConvert NSString:json[@"albumTitle"]]
                 forKey:kGCKMetadataKeyAlbumTitle];
  }
  if (json[@"composer"]) {
    [metadata setString:[RCTConvert NSString:json[@"composer"]]
                 forKey:kGCKMetadataKeyComposer];
  }
  if (json[@"discNumber"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"discNumber"]]
                  forKey:kGCKMetadataKeyDiscNumber];
  }
  if (json[@"trackNumber"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"trackNumber"]]
                  forKey:kGCKMetadataKeyTrackNumber];
  }
  if (json[@"seasonNumber"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"seasonNumber"]]
                  forKey:kGCKMetadataKeySeasonNumber];
  }
  if (json[@"episodeNumber"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"episodeNumber"]]
                  forKey:kGCKMetadataKeyEpisodeNumber];
  }
  if (json[@"seriesTitle"]) {
    [metadata setString:[RCTConvert NSString:json[@"seriesTitle"]]
                 forKey:kGCKMetadataKeySeriesTitle];
  }
  if (json[@"studio"]) {
    [metadata setString:[RCTConvert NSString:json[@"studio"]]
                 forKey:kGCKMetadataKeyStudio];
  }
  if (json[@"width"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"width"]]
                  forKey:kGCKMetadataKeyWidth];
  }
  if (json[@"height"]) {
    [metadata setInteger:[RCTConvert NSInteger:json[@"height"]]
                  forKey:kGCKMetadataKeyHeight];
  }
  if (json[@"location"]) {
    [metadata setString:[RCTConvert NSString:json[@"location"]]
                 forKey:kGCKMetadataKeyLocationName];
  }
  if (json[@"latitude"]) {
    [metadata setDouble:[RCTConvert double:json[@"latitude"]]
                 forKey:kGCKMetadataKeyLocationLatitude];
  }
  if (json[@"longitude"]) {
    [metadata setDouble:[RCTConvert double:json[@"longitude"]]
                 forKey:kGCKMetadataKeyLocationLongitude];
  }
  
  return metadata;
}

+ (id)fromGCKMediaMetadata:(GCKMediaMetadata *)metadata {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];
  
  json[@"type"] = [RCTConvert fromGCKMediaMetadataType:metadata.metadataType];

  NSMutableArray<id> *images = [[NSMutableArray alloc] init];
  for (GCKImage *image in metadata.images) {
    [images addObject:[RCTConvert fromGCKImage:image]];
  };
  json[@"images"] = images;
  
  switch (metadata.metadataType) {
    case GCKMediaMetadataTypeGeneric:
      json[@"artist"] = [metadata stringForKey:kGCKMetadataKeyArtist];
      json[@"releaseDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyReleaseDate];
      json[@"subtitle"] = [metadata stringForKey:kGCKMetadataKeySubtitle];
      json[@"title"] = [metadata stringForKey:kGCKMetadataKeyTitle];
      break;
    case GCKMediaMetadataTypeMovie:
      json[@"releaseDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyReleaseDate];
      json[@"studio"] = [metadata stringForKey:kGCKMetadataKeyStudio];
      json[@"subtitle"] = [metadata stringForKey:kGCKMetadataKeySubtitle];
      json[@"title"] = [metadata stringForKey:kGCKMetadataKeyTitle];
      break;
    case GCKMediaMetadataTypeMusicTrack:
      json[@"albumArtist"] = [metadata stringForKey:kGCKMetadataKeyAlbumArtist];
      json[@"albumTitle"] = [metadata stringForKey:kGCKMetadataKeyAlbumTitle];
      json[@"artist"] = [metadata stringForKey:kGCKMetadataKeyArtist];
      json[@"composer"] = [metadata stringForKey:kGCKMetadataKeyComposer];
      json[@"discNumber"] = @([metadata integerForKey:kGCKMetadataKeyDiscNumber]);
      json[@"releaseDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyReleaseDate];
      json[@"title"] = [metadata stringForKey:kGCKMetadataKeyTitle];
      json[@"trackNumber"] = @([metadata integerForKey:kGCKMetadataKeyTrackNumber]);
      break;
    case GCKMediaMetadataTypePhoto:
      json[@"artist"] = [metadata stringForKey:kGCKMetadataKeyArtist];
      json[@"creationDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyCreationDate];
      json[@"height"] = @([metadata integerForKey:kGCKMetadataKeyHeight]);
      json[@"latitude"] = @([metadata integerForKey:kGCKMetadataKeyLocationLatitude]);
      json[@"location"] = [metadata stringForKey:kGCKMetadataKeyLocationName];
      json[@"longitude"] = @([metadata integerForKey:kGCKMetadataKeyLocationLongitude]);
      json[@"title"] = [metadata stringForKey:kGCKMetadataKeyTitle];
      json[@"width"] = @([metadata integerForKey:kGCKMetadataKeyWidth]);
      break;
    case GCKMediaMetadataTypeTVShow:
      json[@"broadcastDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyBroadcastDate];
      json[@"releaseDate"] = [metadata dateAsStringForKey:kGCKMetadataKeyReleaseDate];
      json[@"seasonNumber"] = @([metadata integerForKey:kGCKMetadataKeySeasonNumber]);
      json[@"seriesTitle"] = [metadata stringForKey:kGCKMetadataKeySeriesTitle];
      json[@"title"] = [metadata stringForKey:kGCKMetadataKeyTitle];
      break;
    default:
      break;
  }
  
  return json;
}

@end
