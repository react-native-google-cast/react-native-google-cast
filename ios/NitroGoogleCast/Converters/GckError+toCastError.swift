import Foundation
import GoogleCast

/// Maps a `GCKError` to a `CastErrorCode` string literal (our TS string-literal union).
///
/// Guard on `error.domain == kGCKErrorDomain` at call sites that may receive errors from
/// other NS error domains before calling this method.
///
/// Phase 3/4 reject sites will assemble the full `CastError` struct (`{ code, message, nativeCode }`)
/// using this code plus `error.localizedDescription` and `error.code`.
extension GCKError {
  func toCastErrorCode() -> String {
    switch GCKErrorCode(rawValue: code) {
    case .networkError, .networkNotReachable:
      return "network"
    case .timeout:
      return "timeout"
    case .cancelled, .launchRequestCancelled:
      return "cancelled"
    case .replaced, .appDidEnterBackground:
      return "interrupted"
    case .notAllowed, .maxUsersConnected:
      return "notAllowed"
    case .invalidRequest, .invalidApplicationSessionID, .invalidMediaPlayerState:
      return "invalidRequest"
    case .socketInvalidParameter:
      return "invalidParameter"
    case .deviceAuthenticationFailure,
         .deviceAuthorizationFailure,
         .secureTransportError,
         .authenticationErrorReceived,
         .malformedClientCertificate,
         .notX509Certificate,
         .deviceCertificateNotTrusted,
         .sslCertificateNotTrusted,
         .malformedAuthenticationResponse,
         .crlInvalid,
         .crlCheckFailed,
         .deviceAuthenticationMessageParseFailure,
         .deviceAuthenticationMessageChallengeReceivedFailure,
         .deviceAuthenticationTimeoutFailure:
      return "authentication"
    case .channelNotConnected,
         .deviceNotConnected,
         .sessionIsNotActive,
         .noMediaSession,
         .notCastSession,
         .disconnected:
      return "noSession"
    case .applicationNotFound,
         .applicationNotRunning,
         .applicationNotRunningWithNamespaceMismatched,
         .applicationNotRunningWhenResumed,
         .applicationNotRunningForJoin,
         .applicationNotRunningForJoinWhenReconnecting,
         .applicationNotRunningWithApplicationIDMismatch:
      return "appNotFound"
    case .deviceCapabilityNotSupported,
         .unsupportedFeature,
         .remoteDisplayDeviceNotSupported,
         .remoteDisplayFeatureNotSupported:
      return "notSupported"
    default:
      return "failed"
    }
  }
}
