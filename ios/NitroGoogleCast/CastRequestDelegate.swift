import Foundation
import GoogleCast
import NitroModules

/// Bridges a single in-flight `GCKRequest` to one `Promise<Void>`, settling it
/// **exactly once** (T6 async-request ownership).
///
/// Ownership model:
/// - GCK retains its `GCKRequest`'s `delegate` only weakly, so this object
///   `selfRetain`s itself while the request is in flight; the retain (and the
///   transport's registry slot) are released the instant the promise settles.
/// - The first of {success, failure, abort, external cancel} wins; every later
///   callback is a no-op thanks to the `settled` guard.
/// - `cancel` lets the transport reject still-pending requests on session
///   teardown/disconnect. After it releases `selfRetain`, GCK's weak ref drops to
///   nil and no further callback can reach a freed delegate.
///
/// All access is main-thread (every `GCKRequest` here is created on the main
/// queue and GCK delivers these callbacks on the main queue), so the mutable
/// `settled`/`selfRetain`/`promise` state needs no locking.
final class CastRequestDelegate: NSObject, GCKRequestDelegate {
  private var promise: Promise<Void>?
  private var onSettle: ((CastRequestDelegate) -> Void)?
  private var selfRetain: CastRequestDelegate?
  private var settled = false

  init(promise: Promise<Void>, onSettle: @escaping (CastRequestDelegate) -> Void) {
    self.promise = promise
    self.onSettle = onSettle
    super.init()
  }

  /// Retain self and become the request's (weakly-held) delegate. Main thread.
  func track(_ request: GCKRequest) {
    selfRetain = self
    request.delegate = self
  }

  /// Reject a still-pending request from outside (teardown / disconnect). No-op
  /// once settled. Main thread.
  func cancel(code: String, message: String) {
    settle { $0?.reject(withError: castRejection(code: code, message: message, nativeCode: nil)) }
  }

  private func settle(_ body: (Promise<Void>?) -> Void) {
    guard !settled else { return }
    settled = true
    body(promise)
    promise = nil
    onSettle?(self)
    onSettle = nil
    selfRetain = nil
  }

  // MARK: - GCKRequestDelegate

  func requestDidComplete(_ request: GCKRequest) {
    settle { $0?.resolve(withResult: ()) }
  }

  func request(_ request: GCKRequest, didFailWithError error: GCKError) {
    settle {
      $0?.reject(
        withError: castRejection(
          code: error.toCastErrorCode(),
          message: error.localizedDescription,
          nativeCode: error.code))
    }
  }

  func request(_ request: GCKRequest, didAbortWith abortReason: GCKRequestAbortReason) {
    let code = abortReason == .cancelled ? "cancelled" : "interrupted"
    settle {
      $0?.reject(
        withError: castRejection(code: code, message: "The request was aborted.", nativeCode: nil))
    }
  }
}
