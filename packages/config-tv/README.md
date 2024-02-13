# @react-native-tvos/config-tv

Expo Config Plugin to auto-configure the native directories for TV development using the [React Native TV fork](https://github.com/react-native-tvos/react-native-tvos). The TV fork supports development for both phone (Android and iOS) and TV (Android TV and Apple TV), so the plugin can be used in a project that targets both phone and TV devices.

_Notes_:

- This package cannot be used in the "Expo Go" app because Expo Go does not support TV.
- Apple TV development will work with many of the commonly used SDK 50 packages, including `expo-updates`, but many Expo packages do not work on Apple TV and are not supported. In particular, `expo-dev-client` and `expo-router` are not supported.

## Expo installation

- First install the package with yarn, npm, or [`npx expo install`](https://docs.expo.io/workflow/expo-cli/#expo-install).

```sh
npx expo install @react-native-tvos/config-tv
```

After installing this npm package, add the [config plugin](https://docs.expo.io/guides/config-plugins/) to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["@react-native-tvos/config-tv"]
  }
}
```

or

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-tvos/config-tv",
        {
          "isTV": true,
          "showVerboseWarnings": false,
          "tvosDeploymentTarget": "13.4",
          "removeFlipperOnAndroid": true,
          "androidTVBanner": "assets/images/tv_banner.png"
        }
      ]
    ]
  }
}
```

## Usage

_Plugin parameters_:

- `isTV`: (optional boolean, default false) If true, prebuild should generate or modify Android and iOS files to build for TV (Android TV and Apple TV). If false, the plugin will have no effect. Setting the environment variable EXPO_TV to "true" or "1" will override this value and force a TV build.
- `showVerboseWarnings`: Deprecated. Verbose logging is now shown as in other config plugins, by setting an environment variable:
  - `EXPO_DEBUG=1` (shows debug messages from all plugins)
  - `DEBUG=expo:*` (shows debug messages from all plugins)
  - `DEBUG=expo:react-native-tvos:config-tv` (shows debug messages from this plugin only)
- `tvosDeploymentTarget`: (optional string, default '13.4') Used to set the tvOS deployment target version in the Xcode project.
- `removeFlipperOnAndroid`: (optional boolean, default true) Used to remove the Flipper dependency from `MainApplication.kt` (or `MainApplication.java`) and `android/app/build.gradle`. This is necessary for React Native TV 0.73 and higher, since Flipper integration is removed from these versions. If this causes issues, set the value to false, run `npx expo prebuild --clean` again, and then remove Flipper from your Android source manually.
- `androidTVBanner`: (optional string) If set, this should be a path to an existing PNG file appropriate for an Android TV banner image. See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#banner . The Android manifest will be modified to reference this image, and the image will be copied into Android resource drawable directories.

_Warning_:

When this plugin is used to generate files in the iOS directory that build an Apple TV or Android TV app, your React Native dependency in `package.json` MUST be set to the React Native TV fork, as shown in the example below:

```json
{
  "dependencies": {
    "react-native": "npm:react-native-tvos@^0.73.2-0"
  }
}
```

If this is not the case, the plugin will run successfully, but Cocoapods installation will fail, since React Native core repo does not support Apple TV. Android TV build will succeed, but will not contain native changes needed to correctly navigate the screen using a TV remote, and may have other problems.

_Warning_:

If you have already generated native directories for a phone build, and set `EXPO_TV` to "true" or "1" (or set the `isTV` plugin parameter to true), then running `npx expo prebuild` again will lead to errors when Cocoapods installation is run again. Similar problems will occur if `EXPO_TV` is set to "0" (or `isTV` set to false) after generating native directories for a TV build.

To avoid this issue, it is strongly recommended to run `npx expo prebuild --clean` if changing the `EXPO_TV` environment variable or the `isTV` plugin parameter. See [this doc](https://docs.expo.dev/workflow/prebuild/#clean) for more details.
