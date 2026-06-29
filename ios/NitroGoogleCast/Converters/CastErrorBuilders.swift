import Foundation
import GoogleCast

/// Maps the `CastErrorCode` string-literal (produced by `GCKError.toCastErrorCode()`)
/// to the generated Nitro `CastErrorCode` enum.
func castErrorCode(fromString value: String) -> CastErrorCode {
  switch value {
  case "noSession": return .nosession
  case "notSupported": return .notsupported
  case "network": return .network
  case "timeout": return .timeout
  case "cancelled": return .cancelled
  case "interrupted": return .interrupted
  case "invalidParameter": return .invalidparameter
  case "invalidRequest": return .invalidrequest
  case "authentication": return .authentication
  case "notAllowed": return .notallowed
  case "appNotFound": return .appnotfound
  default: return .failed
  }
}

extension GCKError {
  /// Build the full typed `CastError` struct streamed in lifecycle events.
  func toCastError() -> CastError {
    CastError(
      code: castErrorCode(fromString: toCastErrorCode()),
      message: localizedDescription,
      nativeCode: Double(code)
    )
  }
}

/// Build a `CastError` from any `Error`, guarding the GCK error domain.
/// GCK delivers `GCKError` (an `NSError` subclass) in its failure callbacks.
func toCastError(_ error: Error?) -> CastError? {
  guard let error else { return nil }
  if let gckError = error as? GCKError {
    return gckError.toCastError()
  }
  let nsError = error as NSError
  return CastError(
    code: .failed, message: nsError.localizedDescription, nativeCode: Double(nsError.code))
}

/// An `Error` whose description is a JSON `CastError` payload — the native side of
/// the TS `parseCastError` translation (critical-gap #12). A string is the one
/// channel guaranteed to survive the Nitro promise-rejection bridge.
struct CastRejection: LocalizedError, CustomStringConvertible {
  let json: String
  var description: String { json }
  var errorDescription: String? { json }
}

/// JSON-encode a rejection payload for a mutation `Promise.reject`.
func castRejection(code: String, message: String?, nativeCode: Int?) -> CastRejection {
  var dict: [String: Any] = ["code": code]
  if let message { dict["message"] = message }
  if let nativeCode { dict["nativeCode"] = nativeCode }
  let data = (try? JSONSerialization.data(withJSONObject: dict)) ?? Data()
  let json = String(data: data, encoding: .utf8) ?? "{\"code\":\"\(code)\"}"
  return CastRejection(json: json)
}
