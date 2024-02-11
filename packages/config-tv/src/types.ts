export type ConfigData = {
  /**
   * If true, prebuild should generate Android and iOS files for TV (Android TV and Apple TV).
   * If false, the default phone-appropriate files should be generated.
   * Setting the environment variable EXPO_TV to "true" or "1" will override
   * this value. (Defaults to false.)
   */
  isTV?: boolean;
  /**
   * If true, verbose warnings will be shown during plugin execution. (Defaults to false.)
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
};
