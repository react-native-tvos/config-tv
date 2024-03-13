export type AppleTVImages = {
  /**
   * Path to 400x240 image
   */
  iconSmall: string;
  /**
   * Path to 800x480 image
   */
  iconSmall2x: string;
  /**
   * Path to 1280x760 image
   */
  icon: string;
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
   * If set, this will be used as the tvOS deployment target version instead of the default (13.4).
   */
  tvosDeploymentTarget?: string;
  /**
   * If set, Android code that references Flipper will be removed. (Defaults to true.)
   */
  removeFlipperOnAndroid?: boolean;
  /**
   * If set, this should be a path to an existing PNG file appropriate for an Android TV banner image.
   * See https://developer.android.com/design/ui/tv/guides/system/tv-app-icon-guidelines#banner
   * The Android manifest will be modified to reference this image, and the image will be copied into
   * Android resource drawable directories.
   */
  androidTVBanner?: string;
  /**
   * If set, this is an object with the paths to images needed to construct the Apple TV icon and
   * top shelf brand assets. The images will be used to construct a brand asset catalog in the Xcode
   * project Image catalog, and the project updated to use the brand assets as the source for the app
   * icons. If this property is set, all six image paths must be defined and the files must exist,
   * or an error will be thrown. The images need to be the exact sizes shown here, in order to avoid
   * errors during Xcode compilation and on submission to the App Store or TestFlight.
   */
  appleTVImages?: AppleTVImages;
};
