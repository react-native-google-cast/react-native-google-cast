/** The possible casting states. */
declare enum CastState {
    /** No cast devices are available. */
    NO_DEVICES_AVAILABLE = "noDevicesAvailable",
    /** Cast devices are available, but a cast session is not established. */
    NOT_CONNECTED = "notConnected",
    /** Cast session is being established. */
    CONNECTING = "connecting",
    /** Cast session is established. */
    CONNECTED = "connected"
}
export default CastState;
