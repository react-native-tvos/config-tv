# TestConfigPluginTV

A test app to try out `@config-plugins/tv`.

Includes code to exercise EAS Update, and show a video using `expo-video`.

## Quick start

```sh
yarn
eas init
eas build:configure
eas update:configure
```
## Build on your desktop

```sh
# Set up to build for TV
export EXPO_TV=1
npx expo prebuild

# Build debug app with packager
yarn ios

# Build release app for EAS update testing
yarn ios --configuration Release

# Now switch back to building for phone
unset EXPO_TV
npx expo prebuild --clean

yarn ios

yarn ios --configuration Release

```

You can also use `yarn android` to build an Android app for either a TV emulator or a phone emulator.

## Build on EAS

```sh
# Build an iOS simulator app
eas build -e preview -p ios

# Build an Apple TV simulator app
eas build -e preview_tv -p ios

# Build an Android phone app
eas build -e preview -p android

# Build an Android TV app
eas build -e preview_tv -p android
```

There are also profiles to build development apps for TV that can run against the packager with `npx expo start`.

