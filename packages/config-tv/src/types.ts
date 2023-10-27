export type ConfigData = {
  /**
   * If true, prebuild should generate Android and iOS files for TV (Android TV and Apple TV).
   * If false, the default phone-appropriate files should be generated.
   * Setting the environment variable EXPO_TV to "true" or "1" will override
   * this value.
   */
  isTV?: boolean;
  /**
   * If true, verbose warnings will be shown during plugin execution.
   */
  showVerboseWarnings?: boolean;
  /**
   * If set, this will be used as the tvOS deployment target version instead of the default (13.4).
   */
  tvosDeploymentTarget?: string;
};
