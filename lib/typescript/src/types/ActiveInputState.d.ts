/** The possible states of the receiver active-input. */
declare enum ActiveInputState {
    /** Indicates that it is not known (and/or not possible to know) whether the Google cast device is the currently active video input. Active input state can only be reported when the Google cast device is connected to a TV or AVR with CEC support. */
    UNKNOWN = "unknown",
    /** Indicates that the Google cast device is not the currently active video input. */
    INACTIVE = "inactive",
    /** Indicates that the Google cast device is the currently active video input. */
    ACTIVE = "active"
}
export default ActiveInputState;
