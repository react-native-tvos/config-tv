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
          "tvosDeploymentTarget": "15.1",
          "removeFlipperOnAndroid": true,
          "androidTVBanner": "assets/images/tv_banner.png",
          "androidTVIcon": "assets/images/tv_icon.png",
          "appleTVImages": {
            "icon": "./assets/images/myimage-tvos-1280x768.png",
            "iconSmall": "./assets/images/myimage-tvos-400x240.png",
            "iconSmall2x": "./assets/images/myimage-tvos-800x480.png",
            "topShelf": "./assets/images/myimage-tvos-1920x720.png",
            "topShelf2x": "./assets/images/myimage-tvos-3840x1440.png",
            "topShelfWide": "./assets/images/myimage-tvos-2320x720.png",
            "topShelfWide2x": "./assets/images/myimage-tvos-4640x1440.png"
          }
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
- `tvosDeploymentTarget`: (optional string, default '15.1') Used to set the tvOS deployment target version in the Xcode project.
- `removeFlipperOnAndroid`: (optional boolean, default false) Used to remove the Flipper dependency from `MainApplication.kt` (or `MainApplication.java`) and `android/app/build.gradle`. This may be necessary for React Native TV 0.73 and higher, since Flipper integration is removed from these versions. If this causes issues, set the value to false, run `npx expo prebuild --clean` again, and then remove Flipper from your Android source manually. If enabled, this change will be made regardless of the setting of the `EXPO_TV` environment variable or the value of the `isTV` plugin parameter.
- `androidTVRequired`: (optional boolean, default false) If set, the Android manifest will be configured for Android TV only (no Android mobile support). Specifically, the "uses-feature" tag for "android.software.leanback" will be set to "required=true".
- `androidTVBanner`: (optional string) If set, this should be a path to an existing PNG file appropriate for an Android TV banner image. See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#banner . The Android manifest will be modified to reference this image, and the image will be copied into Android resource drawable directories. **NOTE:** This does not apply to Fire TV and is instead set by the app store submission. See https://developer.amazon.com/docs/app-submission/appstore-details.html#firetvassets
- `androidTVIcon`: (optional string) If set, this should be a path to an existing PNG file appropriate for an Android TV icon image. See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#launcher-icon . The Android manifest will be modified to reference this image, and the image will be copied into Android resource drawable and mipmap directories.
- `appleTVImages`: (optional object) If set, this is an object with the paths to images needed to construct the Apple TV icon and top shelf brand assets. The images will be used to construct a brand asset catalog in the Xcode project Image catalog, and the project updated to use the brand assets as the source for the app icons. If this property is set, every app icon and top shelf image must be defined and the files must exist, or an error will be thrown. An app icon is defined either by its single image or by its layers. The images need to be the exact sizes shown here, in order to avoid errors during Xcode compilation and on submission to the App Store or TestFlight.
  - `icon`: (string) Path to a 1280x768 image. Not needed when `iconLayers` is set.
  - `iconLayers`: (optional object) Paths to 1280x768 images, one per layer. Takes precedence over `icon`. See [layered app icons](#layered-app-icons)
  - `iconSmall`: (string) Path to a 400x240 image. Not needed when `iconSmallLayers` is set.
  - `iconSmallLayers`: (optional object) Paths to 400x240 images, one per layer. Takes precedence over `iconSmall`
  - `iconSmall2x`: (string) Path to a 800x480 image. Not needed when `iconSmall2xLayers` is set.
  - `iconSmall2xLayers`: (optional object) Paths to 800x480 images, one per layer. Takes precedence over `iconSmall2x`
  - `topShelf`: (string) Path to a 1920x720 image
  - `topShelf2x`: (string) Path to a 3840x1440 image
  - `topShelfWide`: (string) Path to a 2320x720 image
  - `topShelfWide2x`: (string) Path to a 4640x1440 image

### Layered app icons

An Apple TV app icon is made of up to three layers, which tvOS shifts apart when the icon is
focused to give it a parallax effect. Passing a single image (`icon`, `iconSmall`,
`iconSmall2x`) puts that same image in every layer, so the icon renders flat.

To keep the parallax effect, pass the artwork for each layer instead. The front layer is
normally the logo on a transparent background, and the back layer is the opaque background.
The middle layer is optional, but every scale of one icon must have the same layers: either all
of them supply a middle layer, or none do, otherwise an error is thrown. Every layer must be the
size documented for the icon it belongs to. Xcode only enforces that on the bottom layer, so a
layer given at the wrong size compiles without a warning and renders incorrectly on the device.

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-tvos/config-tv",
        {
          "appleTVImages": {
            "iconLayers": {
              "front": "./assets/images/front-1280x768.png",
              "back": "./assets/images/back-1280x768.png"
            },
            "iconSmallLayers": {
              "front": "./assets/images/front-400x240.png",
              "middle": "./assets/images/middle-400x240.png",
              "back": "./assets/images/back-400x240.png"
            },
            "iconSmall2xLayers": {
              "front": "./assets/images/front-800x480.png",
              "middle": "./assets/images/middle-800x480.png",
              "back": "./assets/images/back-800x480.png"
            },
            "topShelf": "./assets/images/myimage-tvos-1920x720.png",
            "topShelf2x": "./assets/images/myimage-tvos-3840x1440.png",
            "topShelfWide": "./assets/images/myimage-tvos-2320x720.png",
            "topShelfWide2x": "./assets/images/myimage-tvos-4640x1440.png"
          }
        }
      ]
    ]
  }
}
```

Each app icon scale needs either its single image or its layers. Mixing the two is allowed: a
scale left as a single image contributes that image to every layer, so it can be combined with
layers that include a middle one.

The images of one layer are copied into the asset catalog under their own file names, so the file
name of each scale must be different. `assets/tv/400x240/front.png` together with
`assets/tv/800x480/front.png` is rejected; `front-400x240.png` and `front-800x480.png` work.

_Warning_:

When this plugin is used to generate files in the iOS directory that build an Apple TV or Android TV app, your React Native dependency in `package.json` MUST be set to the React Native TV fork, as shown in the example below:

```json
{
  "dependencies": {
    "react-native": "npm:react-native-tvos@^0.73.6-0"
  }
}
```

If this is not the case, the plugin will run successfully, but Cocoapods installation will fail, since React Native core repo does not support Apple TV. Android TV build will succeed, but will not contain native changes needed to correctly navigate the screen using a TV remote, and may have other problems.

_Warning_:

If you have already generated native directories for a phone build, and set `EXPO_TV` to "true" or "1" (or set the `isTV` plugin parameter to true), then running `npx expo prebuild` again will lead to errors when Cocoapods installation is run again. Similar problems will occur if `EXPO_TV` is set to "0" (or `isTV` set to false) after generating native directories for a TV build.

To avoid this issue, it is strongly recommended to run `npx expo prebuild --clean` if changing the `EXPO_TV` environment variable or the `isTV` plugin parameter. See [this doc](https://docs.expo.dev/workflow/prebuild/#clean) for more details.
