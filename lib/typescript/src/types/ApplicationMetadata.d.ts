import WebImage from './WebImage';
/**
 * Information about a receiver application.
 *
 * @see [Android](https://developers.google.com/android/reference/com/google/android/gms/cast/ApplicationMetadata) | [iOS](https://developers.google.com/cast/docs/reference/ios/interface_g_c_k_application_metadata) | [Chrome](https://developers.google.com/cast/docs/reference/chrome/cast.framework.ApplicationMetadata)
 */
export default interface ApplicationMetadata {
    /** The application's unique ID. This is the one registered in the Google Cast SDK Developer Console. */
    applicationId: string;
    /** Images associated with the receiver application. */
    images: WebImage[];
    /** Application's human-readable name. */
    name: string;
    /** Namespaces supported by the receiver application. */
    namespaces: string[];
}
