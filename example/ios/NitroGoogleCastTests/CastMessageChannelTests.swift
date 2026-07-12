import GoogleCast
import XCTest

@testable import NitroGoogleCast

final class CastMessageChannelTests: XCTestCase {
  func testForwardsTextMessages() {
    var received: [String] = []
    let channel = CastMessageChannel(
      namespace: "urn:x-cast:test",
      onMessage: { received.append($0) },
      onStatus: { _, _ in })
    channel.didReceiveTextMessage("hello")
    XCTAssertEqual(received, ["hello"])
  }

  func testEmitsStatusOnConnectDisconnectAndWritableChange() {
    var emits = 0
    let channel = CastMessageChannel(
      namespace: "urn:x-cast:test",
      onMessage: { _ in },
      onStatus: { _, _ in emits += 1 })
    channel.didConnect()
    channel.didDisconnect()
    channel.didChangeWritableState(true)
    // The assertion is the *forwarding*; off-session GCK reports
    // not-connected/not-writable, so values aren't asserted here.
    XCTAssertEqual(emits, 3)
  }
}
