// Copyright 2014 Google Inc.

#import <Availability.h>

#define GCK_EXPORT __attribute__((visibility("default")))
#define GCK_DEPRECATED(message) __attribute__((deprecated(message)))

#ifdef __cplusplus
#define GCK_EXTERN extern "C" GCK_EXPORT
#else
#define GCK_EXTERN extern GCK_EXPORT
#endif

#if __has_feature(nullability)
  #define GCK_NULLABLE_TYPE __nullable
  #define GCK_NONNULL_TYPE __nonnull
  #define GCK_NULLABLE nullable
  #define GCK_NONNULL nonnull
#else
  #define GCK_NULLABLE_TYPE
  #define GCK_NONNULL_TYPE
  #define GCK_NULLABLE
  #define GCK_NONNULL
#endif  // __has_feature(nullability)

#if __has_feature(assume_nonnull)
  #define GCK_ASSUME_NONNULL_BEGIN _Pragma("clang assume_nonnull begin")
  #define GCK_ASSUME_NONNULL_END   _Pragma("clang assume_nonnull end")
#else
  #define GCK_ASSUME_NONNULL_BEGIN
  #define GCK_ASSUME_NONNULL_END
#endif  // __has_feature(assume_nonnull)
