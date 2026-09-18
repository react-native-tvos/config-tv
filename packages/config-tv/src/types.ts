/**
 * Paths to the images for the layers of one Apple TV app icon. tvOS shifts the layers
 * apart when the icon is focused, which is what gives the icon its parallax effect.
 */
export type AppleTVIconLayers = {
  /**
   * Path to the front layer, normally the logo on a transparent background
   */
  front: string;
  /**
   * Path to the middle layer, if the icon has one
   */
  middle?: string;
  /**
   * Path to the back layer, normally the opaque background
   */
  back: string;
};

export type AppleTVImages = {
  /**
   * Path to 400x240 image, used for every layer. Either this or `iconSmallLayers` is required.
   */
  iconSmall?: string;
  /**
   * Paths to 400x240 images, one per layer. Takes precedence over `iconSmall`.
   */
  iconSmallLayers?: AppleTVIconLayers;
  /**
   * Path to 800x480 image, used for every layer. Either this or `iconSmall2xLayers` is required.
   */
  iconSmall2x?: string;
  /**
   * Paths to 800x480 images, one per layer. Takes precedence over `iconSmall2x`.
   */
  iconSmall2xLayers?: AppleTVIconLayers;
  /**
   * Path to 1280x768 image, used for every layer. Either this or `iconLayers` is required.
   */
  icon?: string;
  /**
   * Paths to 1280x768 images, one per layer. Takes precedence over `icon`.
   */
  iconLayers?: AppleTVIconLayers;
  /**
   * Path to 1920x720 image
   */
  topShelf: string;
  /**
   * Path to 3840x1440 image
   */
  topShelf2x: string;
  /**
   * Path to 2320x720 image
   */
  topShelfWide: string;
  /**
   * Path to 4640x1440 image
   */
  topShelfWide2x: string;
};

export type ConfigData = {
  /**
   * If true, prebuild should generate Android and iOS files for TV (Android TV and Apple TV).
   * If false, the default phone-appropriate files should be generated.
   * Setting the environment variable EXPO_TV to "true" or "1" will override
   * this value. (Defaults to false.)
   */
  isTV?: boolean;
  /**
   * Deprecated. Verbose logging is now shown as in other config plugins, by setting an environment variable:
   * EXPO_DEBUG=1
   * or
   * DEBUG=expo:* (shows debug messages from all plugins)
   * or
   * DEBUG=expo:react-native-tvos:config-tv (shows debug messages from this plugin only)
   */
  showVerboseWarnings?: boolean;
  /**
   * If set, this will be used as the tvOS deployment target version instead of the default (15.1).
   */
  tvosDeploymentTarget?: string;
  /**
   * If set, Android code that references Flipper will be removed. (Defaults to false.)
   * If enabled, this change will be made regardless of the setting of the `EXPO_TV` environment variable or
   * the value of the `isTV` plugin parameter.
   */
  removeFlipperOnAndroid?: boolean;
  /**
   * If set, the Android manifest will be configured for Android TV only
   * (no Android mobile support).
   * Specifically, the "uses-feature" tag for "android.software.leanback"
   * will be set to "required=true".
   */
  androidTVRequired?: boolean;
  /**
   * If set, this should be a path to an existing PNG file appropriate for an Android TV banner image.
   * See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#banner
   * The Android manifest will be modified to reference this image, and the image will be copied into
   * Android resource drawable directories.
   */
  androidTVBanner?: string;
  /**
   * If set, this should be a path to an existing PNG file appropriate for an Android TV icon image.
   * See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#launcher-icon
   * The icon image will not be resized.
   * The Android manifest will be modified to reference this image and the image will be copied into
   * Android resource drawable directories.
   */
  androidTVIcon?: string;
  /**
   * If set, this is an object with the paths to images needed to construct the Apple TV icon and
   * top shelf brand assets. The images will be used to construct a brand asset catalog in the Xcode
   * project Image catalog, and the project updated to use the brand assets as the source for the app
   * icons. If this property is set, every brand asset must have an image and the files must
   * exist, or an error will be thrown; each app icon takes either a single image or one image
   * per layer. The images need to be the exact sizes shown here, in order to avoid errors
   * during Xcode compilation and on submission to the App Store or TestFlight.
   */
  appleTVImages?: AppleTVImages;
};
