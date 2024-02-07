require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name     = package['name']
  s.version  = package['version']
  s.summary  = package['description']
  s.license  = package['license']

  s.authors  = package['contributors']
  s.homepage = package['homepage']
  s.platform = :ios, '10.0'
  s.static_framework = true

  s.source = {
    git: 'https://github.com/react-native-google-cast/react-native-google-cast.git',
    tag: s.version.to_s
  }
  s.default_subspec = 'NoBluetoothArm'

  s.dependency 'React'

  s.subspec 'GuestMode' do |ss|
    ss.dependency "#{package['name']}/RNGoogleCast"
    ss.dependency 'google-cast-sdk'
  end

  s.subspec 'GuestModeArm' do |ss|
    ss.dependency "#{package['name']}/RNGoogleCast"
    ss.dependency 'google-cast-sdk-xcframework'
  end

  s.subspec 'NoBluetooth' do |ss|
    ss.dependency "#{package['name']}/RNGoogleCast"
    ss.dependency 'google-cast-sdk-no-bluetooth'
  end

  s.subspec 'NoBluetoothArm' do |ss|
    ss.dependency "#{package['name']}/RNGoogleCast"
    ss.dependency 'google-cast-sdk-no-bluetooth-xcframework'
  end

  s.subspec 'RNGoogleCast' do |ss|
    ss.source_files = 'ios/RNGoogleCast/**/*.{h,m}'
    ss.dependency 'PromisesObjC'
  end
end
