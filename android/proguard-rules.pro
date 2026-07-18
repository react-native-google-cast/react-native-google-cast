# Consumer rules for react-native-google-cast (wired via consumerProguardFiles).
#
# The Cast SDK instantiates the OptionsProvider reflectively from the
# OPTIONS_PROVIDER_CLASS_NAME manifest meta-data — invisible to R8, so the
# class and its nullary constructor must be kept explicitly (E5). Apps that
# subclass NitroCastOptionsProvider (or ship their own OptionsProvider) need
# an equivalent keep rule of their own for that class.
-keep class com.margelo.nitro.googlecast.NitroCastOptionsProvider {
    <init>();
}
