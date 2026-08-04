import GoogleCast
import XCTest

@testable import NitroGoogleCast

/// Pins the v4-parity default image picker (design §iOS, E1/E3/E9 + contract i):
/// - vector-driven heuristic tests from the shared cross-platform corpus
///   `fixtures/cast-options/heuristics.json` (the same file drives the Android
///   JVM suite — drift between the Kotlin and Swift implementations is a red
///   test, not a device-pass surprise);
/// - the pure `installIfAbsent` seam (E9), no singleton required;
/// - ONE narrow, `isSharedInstanceInitialized`-guarded singleton pin for the
///   unset-picker SDK semantics (contract i): on GCK 4.8.4 an unset
///   `imagePicker` reads the internal `GCKUIDefaultImagePicker` (NOT nil, as
///   the design originally assumed — this suite falsified that). No test here
///   ever *sets* `imagePicker`, keeping the shared XCTest target
///   order-independent.
final class NitroImagePickerTests: XCTestCase {

  // MARK: - Fixture loading (repo-root corpus, like the converter suite)

  private struct PickImageVector {
    let surface: String
    let imageCount: Int
    let expectedIndex: Int?
  }

  /// Walks up from this source file to the repo root and loads the shared
  /// heuristics corpus. iOS consumes only the `pickImage` array — the
  /// notification-action heuristic is an Android-only surface.
  private static func loadPickImageVectors() throws -> [PickImageVector] {
    // #filePath = <repoRoot>/example/ios/NitroGoogleCastTests/NitroImagePickerTests.swift
    let repoRoot = URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent()  // NitroGoogleCastTests
      .deletingLastPathComponent()  // ios
      .deletingLastPathComponent()  // example
      .deletingLastPathComponent()  // repo root
    let url =
      repoRoot
      .appendingPathComponent("fixtures")
      .appendingPathComponent("cast-options")
      .appendingPathComponent("heuristics.json")
    let data = try Data(contentsOf: url)
    guard
      let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let vectors = root["pickImage"] as? [[String: Any]]
    else {
      XCTFail("fixtures/cast-options/heuristics.json is malformed")
      return []
    }
    return vectors.map { json in
      PickImageVector(
        surface: json["surface"] as? String ?? "<missing>",
        imageCount: (json["imageCount"] as? NSNumber)?.intValue ?? 0,
        expectedIndex: (json["expectedIndex"] as? NSNumber)?.intValue
      )
    }
  }

  /// Symbolic surface → `GCKMediaMetadataImageType`. Android-only surfaces
  /// (`notificationThumbnail`, `lockScreenBackground`) return nil — the loader
  /// skips them (E3: each platform skips surfaces it cannot represent).
  private static func imageType(forSurface surface: String) -> GCKMediaMetadataImageType? {
    switch surface {
    case "castDialog": return .castDialog
    case "miniController": return .miniController
    case "background": return .background
    case "custom": return .custom
    case "notificationThumbnail", "lockScreenBackground": return nil
    default:
      XCTFail("Unknown heuristics surface \(surface) — update the iOS loader mapping")
      return nil
    }
  }

  private static func makeImages(count: Int) -> [GCKImage] {
    (0..<count).map { index in
      GCKImage(
        url: URL(string: "https://example.com/image-\(index).png")!,
        width: 480, height: 360)
    }
  }

  // MARK: - Vector-driven heuristic (E3)

  func testPickImageVectors() throws {
    let vectors = try Self.loadPickImageVectors()
    XCTAssertFalse(vectors.isEmpty, "heuristics corpus loaded no pickImage vectors")
    var covered = 0
    for vector in vectors {
      guard let imageType = Self.imageType(forSurface: vector.surface) else { continue }
      covered += 1
      let images = Self.makeImages(count: vector.imageCount)
      let picked = NitroImagePicker.pickImage(from: images, imageType: imageType)
      if let expectedIndex = vector.expectedIndex {
        XCTAssertTrue(
          picked === images[expectedIndex],
          "surface \(vector.surface), \(vector.imageCount) image(s): expected index "
            + "\(expectedIndex), got \(String(describing: picked?.url))")
      } else {
        XCTAssertNil(
          picked,
          "surface \(vector.surface), \(vector.imageCount) image(s): expected nil")
      }
    }
    XCTAssertGreaterThan(covered, 0, "iOS loader skipped every vector — mapping broken")
  }

  /// The same vectors driven through the `GCKUIImagePicker` protocol shim
  /// (`getImageWith(_:from:)` — the GCK 4.8.4 bridged selector), so the
  /// metadata/hints plumbing is covered, not just the pure static.
  func testProtocolShimMatchesHeuristic() throws {
    let picker = NitroImagePicker()
    let vectors = try Self.loadPickImageVectors()
    for vector in vectors {
      guard let imageType = Self.imageType(forSurface: vector.surface) else { continue }
      let metadata = GCKMediaMetadata(metadataType: .generic)
      let images = Self.makeImages(count: vector.imageCount)
      for image in images { metadata.addImage(image) }
      let hints = GCKUIImageHints(imageType: imageType, imageSize: CGSize(width: 480, height: 360))
      let picked = picker.getImageWith(hints, from: metadata)
      if let expectedIndex = vector.expectedIndex {
        XCTAssertEqual(
          picked?.url, images[expectedIndex].url,
          "shim: surface \(vector.surface), \(vector.imageCount) image(s)")
      } else {
        XCTAssertNil(picked, "shim: surface \(vector.surface), \(vector.imageCount) image(s)")
      }
    }
  }

  // MARK: - Install seam (E9, no singleton)

  func testInstallIfAbsentInstallsWhenUnset() {
    let installed = NitroImagePicker.installIfAbsent(current: nil)
    XCTAssertTrue(installed is NitroImagePicker, "nil current picker must install ours")
  }

  func testInstallIfAbsentLeavesConsumerPickerAlone() {
    let consumerPicker = ConsumerImagePicker()
    XCTAssertNil(
      NitroImagePicker.installIfAbsent(current: consumerPicker),
      "a consumer-set picker must never be clobbered (contract i)")
  }

  // MARK: - Singleton pin (contract i): unset `imagePicker` is treated as absent

  /// Pins the GCK SDK semantics the install point relies on. The design assumed
  /// an unset `imagePicker` reads `nil` (GCKCastContext+UI.h declares the
  /// property nullable) — empirically FALSE on GCK 4.8.4: the getter returns an
  /// internal `GCKUIDefaultImagePicker` when the app never set one. What the
  /// install guard actually needs is: a never-touched context's picker must be
  /// *recognized as absent* by `installIfAbsent` (nil or GCK's own default), so
  /// the library picker installs. If a GCK upgrade changes the unset
  /// representation again (e.g. renames the default class), this fails loudly
  /// instead of the picker silently never installing. Deliberately does NOT set
  /// `imagePicker` (order-independence with the rest of the shared target).
  func testUnsetImagePickerIsRecognizedAsAbsent() {
    // XCTest runs test methods on the main thread — required for
    // `setSharedInstanceWith` (GCK main-thread-only).
    XCTAssertTrue(Thread.isMainThread)
    if !GCKCastContext.isSharedInstanceInitialized() {
      let criteria = GCKDiscoveryCriteria(applicationID: kGCKDefaultMediaReceiverApplicationID)
      GCKCastContext.setSharedInstanceWith(GCKCastOptions(discoveryCriteria: criteria))
    }
    let unset = GCKCastContext.sharedInstance().imagePicker
    // The test host is the real CastPlayground app: if its JS bundle happened to
    // load during this run, the transport's install point already replaced the
    // SDK default with our picker — that's the install path *working*, not a
    // semantics change. Only a third, unknown class means GCK changed.
    if unset is NitroImagePicker { return }
    XCTAssertTrue(
      NitroImagePicker.installIfAbsent(current: unset) is NitroImagePicker,
      "GCK changed unset-imagePicker semantics (read "
        + "\(unset.map { NSStringFromClass(type(of: $0)) } ?? "nil")) — revisit the "
        + "contract-i install guard")
  }
}

/// A stand-in for a consumer-provided picker (contract-i seam test).
private final class ConsumerImagePicker: NSObject, GCKUIImagePicker {
  func getImageWith(
    _ imageHints: GCKUIImageHints, from metadata: GCKMediaMetadata
  ) -> GCKImage? { nil }
}
